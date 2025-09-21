import Foundation
#if canImport(FirebaseCore)
import FirebaseCore
#endif
#if canImport(FirebaseFirestore)
import FirebaseFirestore
#endif

final class UserService {
	static let shared = UserService()
	private init() {}

	func fetchUser(byName name: String) async throws -> UserRecord? {
		#if canImport(FirebaseCore) && canImport(FirebaseFirestore)
		let snapshot = try await Firestore.firestore().collection("users").document(name).getDocument()
		guard snapshot.exists, var data = snapshot.data() else { return nil }
		data["name"] = name
		let json = try JSONSerialization.data(withJSONObject: data)
		return try JSONDecoder().decode(UserRecord.self, from: json)
		#else
		throw NSError(domain: "UserService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Firestore not available"])
		#endif
	}

	func fetchUser(byEmail email: String) async throws -> UserRecord? {
		#if canImport(FirebaseCore) && canImport(FirebaseFirestore)
		let users = Firestore.firestore().collection("users")
		// First try exact email
		var snapshot = try await users.whereField("profile.email", isEqualTo: email).limit(to: 1).getDocuments()
		if let doc = snapshot.documents.first {
			var data = doc.data(); data["name"] = doc.documentID
			let json = try JSONSerialization.data(withJSONObject: data)
			return try JSONDecoder().decode(UserRecord.self, from: json)
		}
		// Fallback: lowercase email
		let lower = email.lowercased()
		if lower != email {
			snapshot = try await users.whereField("profile.email", isEqualTo: lower).limit(to: 1).getDocuments()
			if let doc = snapshot.documents.first {
				var data = doc.data(); data["name"] = doc.documentID
				let json = try JSONSerialization.data(withJSONObject: data)
				return try JSONDecoder().decode(UserRecord.self, from: json)
			}
		}
		return nil
		#else
		throw NSError(domain: "UserService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Firestore not available"])
		#endif
	}

	#if canImport(FirebaseCore) && canImport(FirebaseFirestore)
	private var userListener: ListenerRegistration?
	#endif

	func listenUser(byEmail email: String, onChange: @escaping (UserRecord?) -> Void) {
		#if canImport(FirebaseCore) && canImport(FirebaseFirestore)
		userListener?.remove(); userListener = nil
		let q = Firestore.firestore().collection("users").whereField("profile.email", isEqualTo: email).limit(to: 1)
		userListener = q.addSnapshotListener { snapshot, _ in
			guard let doc = snapshot?.documents.first else { onChange(nil); return }
			var data = doc.data(); data["name"] = doc.documentID
			if let json = try? JSONSerialization.data(withJSONObject: data), let rec = try? JSONDecoder().decode(UserRecord.self, from: json) {
				onChange(rec)
			} else { onChange(nil) }
		}
		#endif
	}

	func fetchNotifications() async throws -> [NotificationItem] {
		// GET {API_BASE_URL}/api/notifications
		let url = AppConfig.shared.apiBaseURL.appendingPathComponent("api/notifications")
		var request = URLRequest(url: url)
		request.httpMethod = "GET"
		request.setValue("application/json", forHTTPHeaderField: "Accept")
		let (data, response) = try await URLSession.shared.data(for: request)
		guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
			return []
		}
		if let list = try? JSONDecoder().decode([NotificationItem].self, from: data) { return list }
		return []
	}

	func fetchTeam() async -> [TeamUser] {
		#if canImport(FirebaseCore) && canImport(FirebaseFirestore)
		var out: [TeamUser] = []
		let snap = try? await Firestore.firestore().collection("users").getDocuments()
		snap?.documents.forEach { d in
			let data = d.data()
			let name = d.documentID
			let email = (data["profile"] as? [String: Any])?["email"] as? String ?? data["email"] as? String
			let role = (data["profile"] as? [String: Any])?["role"] as? String ?? data["role"] as? String
			let pic = data["profilePicture"] as? String ?? (data["profile"] as? [String: Any])?["profilePicture"] as? String
			out.append(TeamUser(name: name, email: email, role: role, profilePicture: pic))
		}
		return out.sorted { ($0.name ?? "").lowercased() < ($1.name ?? "").lowercased() }
		#else
		return []
		#endif
	}

	func updateProfilePicture(email: String, url: String, path: String) async {
		#if canImport(FirebaseCore) && canImport(FirebaseFirestore)
		let users = Firestore.firestore().collection("users")
		let snapshot = try? await users.whereField("profile.email", isEqualTo: email).limit(to: 1).getDocuments()
		if let doc = snapshot?.documents.first {
			try? await users.document(doc.documentID).setData([
				"profilePicture": url,
				"profile": [
					"email": email,
					"profilePicture": url,
					"picturePath": path
				]
			], merge: true)
		}
		#endif
	}
}


