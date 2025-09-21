import SwiftUI

struct AdminDashboardView: View {
	@StateObject private var vm = JobListViewModel()
	@State private var contractsSummary: String = ""
    @State private var selectedJob: Job?
    @State private var bankLookupEmail: String = ""
    @State private var bankInfo: String = ""

	var body: some View {
		NavigationStack {
			List {
				Section("Jobs") {
					ForEach(vm.allJobs, id: \.self) { job in
						Button { selectedJob = job } label: {
							VStack(alignment: .leading, spacing: 4) {
								Text(job.displayTitle).font(.headline)
								Text(job.location ?? "").font(.subheadline).foregroundColor(.secondary)
							}
						}
					}
				}
                Section("Messaging") {
                    NavigationLink("Open Messages") { MessagesView() }
                }
                Section("Equipment") {
                    NavigationLink("Equipment (User Center)") { UserPortalView() }
                    Text("For admin-only actions, use web dashboard.")
                        .font(.footnote).foregroundColor(.secondary)
                }
				Section("Contracts API (summary)") {
					Text(contractsSummary.isEmpty ? "No data" : contractsSummary)
						.font(.footnote)
				}
                Section("Bank Viewer (lookup)") {
                    HStack {
                        TextField("user@email.com", text: $bankLookupEmail)
                            .keyboardType(.emailAddress)
                        Button("Lookup") { lookupBank() }
                    }
                    if !bankInfo.isEmpty { Text(bankInfo).font(.footnote).foregroundColor(.secondary) }
                }
			}
			.navigationTitle("Admin (Read-Only)")
		}
		.task {
			await vm.load()
			await loadContractsSummary()
		}
        .sheet(item: $selectedJob) { job in
            VStack(spacing: 12) {
                Text(job.displayTitle).font(.title2.bold())
                Text(job.location ?? "").foregroundColor(.secondary)
                if !job.displayPay.isEmpty { Text(job.displayPay) }
                Button("Close") { selectedJob = nil }
            }.padding()
        }
	}

	private func loadContractsSummary() async {
		let url = AppConfig.shared.apiBaseURL.appendingPathComponent("api/contracts/health")
		var req = URLRequest(url: url)
		req.httpMethod = "GET"
		if let (data, resp) = try? await URLSession.shared.data(for: req), let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) {
			contractsSummary = String(data: data, encoding: .utf8) ?? ""
		}
	}

    private func lookupBank() {
        guard !bankLookupEmail.isEmpty else { return }
        // Stub: show guidance; real decryption stays on web admin for security.
        bankInfo = "Use web admin bank viewer to decrypt details for \(bankLookupEmail)."
    }
}


