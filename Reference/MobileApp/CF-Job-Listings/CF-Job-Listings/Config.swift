import Foundation

struct AppConfig {
	static let shared = AppConfig()

	let apiBaseURL: URL

	let firebaseAPIKey: String?
	let firebaseProjectId: String?
	let firebaseAppId: String?
	let firebaseSenderId: String?
	let firebaseStorageBucket: String?
	let firebaseAuthDomain: String?

	private init() {
		guard let path = Bundle.main.path(forResource: "Config", ofType: "plist"),
				let data = FileManager.default.contents(atPath: path),
				let plist = try? PropertyListSerialization.propertyList(from: data, options: [], format: nil) as? [String: Any]
		else {
			fatalError("Config.plist is missing or invalid. Add it to the app target.")
		}

		let base = (plist["API_BASE_URL"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
		guard let url = URL(string: base), !base.isEmpty else {
			fatalError("API_BASE_URL missing in Config.plist")
		}
		self.apiBaseURL = url

		self.firebaseAPIKey = plist["FIREBASE_API_KEY"] as? String
		self.firebaseProjectId = plist["FIREBASE_PROJECT_ID"] as? String
		self.firebaseAppId = plist["FIREBASE_APP_ID"] as? String
		self.firebaseSenderId = plist["FIREBASE_MESSAGING_SENDER_ID"] as? String
		self.firebaseStorageBucket = plist["FIREBASE_STORAGE_BUCKET"] as? String
		self.firebaseAuthDomain = plist["FIREBASE_AUTH_DOMAIN"] as? String
	}
}
