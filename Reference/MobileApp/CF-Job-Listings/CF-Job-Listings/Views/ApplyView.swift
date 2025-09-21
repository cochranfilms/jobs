import SwiftUI

struct ApplyView: View {
	let job: Job

	@Environment(\.dismiss) private var dismiss
	@State private var fullName: String = ""
	@State private var email: String = ""
	@State private var phone: String = ""
	@State private var location: String = ""
	@State private var eventDate: String = ""
	@State private var pay: String = ""
	@State private var description: String = ""
	@State private var portfolio: String = ""
	@State private var isSubmitting = false
	@State private var errorMessage: String?
	@State private var success: Bool = false

	var body: some View {
		Form {
			Section(header: Text("Your Info")) {
				TextField("Full Name", text: $fullName)
				TextField("Email", text: $email)
					.keyboardType(.emailAddress)
				TextField("Phone", text: $phone)
				TextField("Location (City, State)", text: $location)
			}
			Section(header: Text("Job Details")) {
				TextField("Applying For", text: .constant(job.displayTitle))
					.disabled(true)
				TextField("Event Date", text: $eventDate)
				TextField("Pay", text: $pay)
			}
			Section(header: Text("About You")) {
				TextField("Instagram or Portfolio", text: $portfolio)
				TextEditor(text: $description)
					.frame(minHeight: 120)
			}
			if let errorMessage { Text(errorMessage).foregroundColor(.red) }
			if success { Text("Application received!").foregroundColor(.green) }
		}
		.navigationTitle("Apply")
		.toolbar {
			ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } }
			ToolbarItem(placement: .confirmationAction) {
				Button(action: submit) {
					if isSubmitting { ProgressView() } else { Text("Submit") }
				}
				.disabled(isSubmitting || fullName.isEmpty || email.isEmpty)
			}
		}
	}

	private func submit() {
		Task {
			guard !isSubmitting else { return }
			isSubmitting = true
			errorMessage = nil
			defer { isSubmitting = false }
			do {
				// 1) Primary write → Firestore (if available)
				if FirestoreService.isAvailable {
					try await FirestoreService.shared.submitApplication(
						fullName: fullName,
						email: email,
						phone: phone.isEmpty ? nil : phone,
						location: location.isEmpty ? nil : location,
						applyingFor: job.displayTitle,
						eventDate: eventDate.isEmpty ? nil : eventDate,
						pay: pay.isEmpty ? nil : pay,
						description: description.isEmpty ? nil : description,
						portfolio: portfolio.isEmpty ? nil : portfolio,
						source: "ios-app"
					)
				}

				// 2) Best-effort backup write → existing JSON/Vercel API (non-blocking)
				do {
					let payload = ApplicationPayload(
						fullName: fullName,
						email: email,
						phone: phone.isEmpty ? nil : phone,
						location: location.isEmpty ? nil : location,
						applyingFor: job.displayTitle,
						eventDate: eventDate.isEmpty ? nil : eventDate,
						pay: pay.isEmpty ? nil : pay,
						description: description.isEmpty ? nil : description,
						portfolio: portfolio.isEmpty ? nil : portfolio,
						source: "ios-app"
					)
					try await APIService.shared.submitApplication(payload)
				} catch {
					// ignore backup failure
				}

				success = true
				DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { dismiss() }
			} catch {
				errorMessage = (error as NSError).localizedDescription
			}
		}
	}
}
