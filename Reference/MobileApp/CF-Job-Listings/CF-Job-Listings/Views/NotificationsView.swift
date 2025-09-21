import SwiftUI

struct NotificationsView: View {
	@State private var items: [AppNotification] = []

	var body: some View {
		List(items) { n in
			VStack(alignment: .leading, spacing: 4) {
				Text(n.title).font(.headline)
				Text(n.message).font(.subheadline)
				Text(n.timestamp).font(.caption).foregroundColor(.secondary)
			}
		}
		.navigationTitle("Notifications")
		.task { items = await NotificationsService.shared.fetchNotifications() }
	}
}


