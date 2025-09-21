import Foundation

struct AppNotification: Identifiable, Hashable, Codable {
	var id: Int
	var title: String
	var message: String
	var type: String
	var timestamp: String
}

final class NotificationsService {
	static let shared = NotificationsService()
	private init() {}

	func fetchNotifications() async -> [AppNotification] {
		let url = AppConfig.shared.apiBaseURL.appendingPathComponent("api/notifications")
		var req = URLRequest(url: url)
		req.httpMethod = "GET"
		do {
			let (data, resp) = try await URLSession.shared.data(for: req)
			guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else { return [] }
			if let list = try? JSONDecoder().decode([AppNotification].self, from: data) { return list }
		} catch { }
		return []
	}
}


