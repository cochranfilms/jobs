import SwiftUI

struct ContractAccessView: View {
	@State private var name: String = ""
	@State private var email: String = ""
	@State private var isLoading = false
	@State private var errorMessage: String?
	@State private var record: UserRecord?
	@State private var signature: String = ""
	@State private var signatureDate: Date = Date()
	@State private var signing = false
	@State private var signSuccess = false

	var body: some View {
		ScrollView {
			VStack(spacing: 16) {
				Text("Contract Access").cfHeaderStyle()
				CFCard {
					VStack(spacing: 12) {
						TextField("Full Name", text: $name)
							.textContentType(.name)
						TextField("Email", text: $email)
							.textContentType(.emailAddress)
							.keyboardType(.emailAddress)
						if let errorMessage { Text(errorMessage).foregroundColor(CFTheme.error) }
						Button(action: verify) {
							if isLoading { ProgressView() } else { Text("Verify Access").bold() }
						}
						.buttonStyle(CFPrimaryButtonStyle())
					}
				}

				if let rec = record {
					CFCard {
						VStack(alignment: .leading, spacing: 8) {
							Text("Your Freelance Contract").cfSectionHeader()
							Label(rec.profile?.email ?? "", systemImage: "envelope")
							Label(rec.profile?.location ?? "", systemImage: "mappin.and.ellipse")
							Divider()
							Text("Type your full name to sign")
							TextField("Signature", text: $signature)
								.textInputAutocapitalization(.words)
							DatePicker("Signature Date", selection: $signatureDate, displayedComponents: .date)
							Button(action: sign) {
								if signing { ProgressView() } else { Text("Sign Contract").bold() }
							}
							.buttonStyle(CFPrimaryButtonStyle())
							.disabled(signature.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() != (rec.name ?? "").lowercased() || signing)
						}
					}
				}
				if signSuccess { Text("Contract signed successfully!").foregroundColor(CFTheme.success) }
			}
			.padding()
		}
		.background(CFTheme.background.ignoresSafeArea())
		.navigationTitle("Contract")
	}

	private func verify() {
		Task {
			guard !isLoading else { return }
			isLoading = true
			errorMessage = nil
			defer { isLoading = false }
			do {
				guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !email.isEmpty else {
					throw NSError(domain: "Contract", code: 1, userInfo: [NSLocalizedDescriptionKey: "Enter name and email"])
				}
				if let rec = try await UserService.shared.fetchUser(byName: name) {
					if (rec.profile?.email ?? "").lowercased() == email.lowercased() {
						withAnimation { record = rec }
					} else {
						throw NSError(domain: "Contract", code: 2, userInfo: [NSLocalizedDescriptionKey: "Email does not match our records"])
					}
				} else {
					throw NSError(domain: "Contract", code: 3, userInfo: [NSLocalizedDescriptionKey: "Not found. Contact admin if this is an error."])
				}
			} catch {
				errorMessage = (error as NSError).localizedDescription
				record = nil
			}
		}
	}

	private func sign() {
		Task {
			guard let rec = record else { return }
			guard signature.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() == (rec.name ?? "").lowercased() else { return }
			signing = true
			defer { signing = false }
			// Generate minimal PDF to match email/PDF workflow
			let dateStr = ISO8601DateFormatter().string(from: signatureDate)
			let effective = rec.profile?.approvedDate ?? String(dateStr.prefix(10))
			let role = rec.profile?.role ?? "Contractor"
			let loc = rec.profile?.location ?? "Atlanta Area"
			let job = rec.primaryJob.flatMap { rec.jobs?[$0] }
			let start = job?.date ?? rec.application?["eventDate"] ?? "TBD"
			let rate = job?.pay ?? job?.rate ?? "Not specified"
			let contractId = "CF-\(Int(Date().timeIntervalSince1970))"
			if let data = PDFService.shared.generateContractPDF(contractId: contractId,
							freelancerName: rec.name ?? "",
							freelancerEmail: rec.profile?.email ?? "",
							role: role,
							location: loc,
							projectStart: start,
							rate: rate,
							effectiveDate: effective,
							signature: signature,
							signatureDate: String(dateStr.prefix(10))) {
				// Offer share sheet to export PDF (upload handled by web/admin flow)
				let tmp = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("\(contractId).pdf")
				try? data.write(to: tmp)
				await MainActor.run { signSuccess = true }
			}
		}
	}
}


