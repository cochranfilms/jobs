import SwiftUI

struct JobDetailView: View {
	let job: Job
	@State private var showApply = false

	var body: some View {
		ScrollView {
			VStack(alignment: .leading, spacing: 12) {
				Text(job.displayTitle).font(.title).bold()
				if let loc = job.location, !loc.isEmpty { Label(loc, systemImage: "mappin.and.ellipse") }
				if !job.displayPay.isEmpty { Label(job.displayPay, systemImage: "dollarsign.circle") }
				if !job.displayDate.isEmpty { Label(job.displayDate, systemImage: "calendar") }
				Divider()
				Text(job.description ?? "No description provided.")
			}
			.padding()
		}
		.navigationTitle("Details")
		.toolbar {
			ToolbarItem(placement: .bottomBar) {
				Button {
					showApply = true
				} label: {
					Text("Apply Now").bold()
				}
				.buttonStyle(.borderedProminent)
			}
		}
		.sheet(isPresented: $showApply) {
			NavigationStack {
				ApplyView(job: job)
			}
		}
	}
}
