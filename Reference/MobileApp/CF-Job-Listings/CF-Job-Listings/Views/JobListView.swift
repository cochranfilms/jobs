import SwiftUI

struct JobListView: View {
	@StateObject private var vm = JobListViewModel()
	@State private var showFilters = false

	var body: some View {
		NavigationStack {
			Group {
				if vm.isLoading {
					ProgressView("Loading jobs...")
				} else if let error = vm.errorMessage {
					VStack(spacing: 12) {
						Text("Error: \(error)").foregroundColor(.red)
						Button("Retry") { Task { await vm.load() } }
					}
				} else if vm.filteredJobs.isEmpty {
					ContentUnavailableView("No jobs found", systemImage: "doc.text.magnifyingglass")
				} else {
					List(vm.filteredJobs, id: \.self) { job in
						NavigationLink(value: job) {
							VStack(alignment: .leading, spacing: 6) {
								HStack(alignment: .firstTextBaseline, spacing: 8) {
									Text(job.displayTitle).font(.headline)
									Text(job.isActive ? "Active" : (job.normalizedStatus == "filled" ? "Filled" : "Inactive"))
										.font(.caption).bold()
										.padding(.horizontal, 6).padding(.vertical, 2)
										.background(
											RoundedRectangle(cornerRadius: 6)
												.fill(job.isActive ? Color.green.opacity(0.15) : (job.normalizedStatus == "filled" ? Color.orange.opacity(0.15) : Color.gray.opacity(0.15)))
										)
										.foregroundColor(job.isActive ? .green : (job.normalizedStatus == "filled" ? .orange : .secondary))
								}
								Text(job.location ?? "").font(.subheadline).foregroundColor(.secondary)
								if !job.displayPay.isEmpty { Text(job.displayPay).font(.subheadline).foregroundColor(.primary) }
							}
						}
					}
					.listStyle(.insetGrouped)
				}
			}
			.navigationTitle("Jobs")
			.searchable(text: $vm.searchText, placement: .automatic, prompt: "Search jobs")
			.toolbar {
				ToolbarItem(placement: .navigationBarTrailing) {
					Button { showFilters.toggle() } label: { Image(systemName: "slider.horizontal.3") }
				}
			}
			.sheet(isPresented: $showFilters) {
				NavigationStack {
					Form {
						Toggle("Active only", isOn: $vm.activeOnly)
						Picker("Location", selection: Binding(get: { vm.selectedLocation ?? "" }, set: { vm.selectedLocation = $0.isEmpty ? nil : $0 })) {
							Text("All").tag("")
							ForEach(vm.uniqueLocations, id: \.self) { Text($0).tag($0) }
						}
					}
					.navigationTitle("Filters")
					.toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { showFilters = false } } }
				}
			}
			.navigationDestination(for: Job.self) { job in
				JobDetailView(job: job)
			}
		}
		.task { await vm.load() }
		.onAppear { vm.listenRealtime() }
	}
}
