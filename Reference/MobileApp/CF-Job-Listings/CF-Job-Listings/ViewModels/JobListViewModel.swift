import Foundation
import Combine

@MainActor
final class JobListViewModel: ObservableObject {
	@Published var allJobs: [Job] = []
	@Published var filteredJobs: [Job] = []
	@Published var searchText: String = "" { didSet { applyFilters() } }
	@Published var activeOnly: Bool = true { didSet { applyFilters() } }
	@Published var selectedLocation: String? { didSet { applyFilters() } }
	@Published var isLoading: Bool = false
	@Published var errorMessage: String?

	var uniqueLocations: [String] {
		let names = allJobs.compactMap { $0.location?.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
		return Array(Set(names)).sorted()
	}

	#if canImport(FirebaseCore) && canImport(FirebaseFirestore)
	private var jobsListener: Any?
	#endif

	func load() async {
		guard !isLoading else { return }
		isLoading = true
		errorMessage = nil
		do {
			var jobs: [Job] = []
			if FirestoreService.isAvailable {
				// Prefer Firestore as source of truth
				jobs = try await FirestoreService.shared.fetchJobs()
				if jobs.isEmpty {
					// Fallback to API if Firestore returns no jobs
					jobs = try await APIService.shared.fetchJobs()
				}
			} else {
				// Fallback to Vercel API
				jobs = try await APIService.shared.fetchJobs()
			}
			// Normalize status if needed (placeholder for future mapping)
			self.allJobs = jobs
			applyFilters()
		} catch {
			self.errorMessage = (error as NSError).localizedDescription
			self.allJobs = []
			self.filteredJobs = []
		}
		isLoading = false
	}

	func listenRealtime() {
		#if canImport(FirebaseCore) && canImport(FirebaseFirestore)
		// Lightweight approach: simply reload when changes occur (keeps code small for now)
		Task { await load() }
		#endif
	}

	private func applyFilters() {
		var result = allJobs
		if activeOnly {
			result = result.filter { $0.isActive }
		}
		if let loc = selectedLocation, !loc.isEmpty {
			result = result.filter { ($0.location ?? "").localizedCaseInsensitiveContains(loc) }
		}
		if !searchText.isEmpty {
			let q = searchText
			result = result.filter { job in
				(job.displayTitle.localizedCaseInsensitiveContains(q)) ||
				((job.location ?? "").localizedCaseInsensitiveContains(q)) ||
				((job.description ?? "").localizedCaseInsensitiveContains(q))
			}
		}
		self.filteredJobs = result
	}
}
