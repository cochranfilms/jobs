import Foundation

#if canImport(FirebaseCore) && canImport(FirebaseFirestore)
import FirebaseCore
import FirebaseFirestore
#endif

final class FirestoreService {
	static let shared = FirestoreService()
	private init() {}

	static var isAvailable: Bool {
		#if canImport(FirebaseCore) && canImport(FirebaseFirestore)
		return FirebaseApp.app() != nil
		#else
		return false
		#endif
	}

	#if canImport(FirebaseCore) && canImport(FirebaseFirestore)
	private var db: Firestore { Firestore.firestore() }
	#endif

	func fetchJobs() async throws -> [Job] {
		#if canImport(FirebaseCore) && canImport(FirebaseFirestore)
		let snapshot = try await db.collection("jobs").getDocuments()
		let jobs: [Job] = snapshot.documents.compactMap { doc in
			var json = doc.data()
			json["id"] = doc.documentID
			return try? JSONSerialization.data(withJSONObject: json)
		}.compactMap { data in
			try? JSONDecoder().decode(Job.self, from: data)
		}
		return jobs
		#else
		throw NSError(domain: "FirestoreService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Firestore not available"]) 
		#endif
	}

	func submitApplication(fullName: String,
						  email: String,
						  phone: String?,
						  location: String?,
						  applyingFor: String?,
						  eventDate: String?,
						  pay: String?,
						  description: String?,
						  portfolio: String?,
						  source: String = "ios-app") async throws {
		#if canImport(FirebaseCore) && canImport(FirebaseFirestore)
		let userId = fullName.trimmingCharacters(in: .whitespacesAndNewlines)
		guard !userId.isEmpty else {
			throw NSError(domain: "FirestoreService", code: 100, userInfo: [NSLocalizedDescriptionKey: "Full name is required"]) 
		}
		let nowIso = ISO8601DateFormatter().string(from: Date())
		let firestoreUser: [String: Any?] = [
			"profile": [
				"email": email,
				"location": location ?? "",
				"role": "",
				"projectType": ""
			],
			"contract": [
				"contractStatus": "pending"
			],
			"application": [
				"status": "pending",
				"submittedAt": nowIso,
				"jobTitle": applyingFor ?? "",
				"eventDate": eventDate ?? "",
				"pay": pay ?? "",
				"description": description ?? "",
				"phone": phone ?? "",
				"portfolio": portfolio ?? "",
				"source": source
			],
			"jobs": [:],
			"primaryJob": NSNull()
		]

		// Convert [String: Any?] to non-optional values
		var cleaned: [String: Any] = [:]
		for (k, v) in firestoreUser {
			if let dict = v as? [String: Any?] {
				var inner: [String: Any] = [:]
				for (ik, iv) in dict { inner[ik] = iv ?? NSNull() }
				cleaned[k] = inner
			} else if let val = v { cleaned[k] = val } else { cleaned[k] = NSNull() }
		}

		try await db.collection("users").document(userId).setData(cleaned, merge: true)
		#else
		throw NSError(domain: "FirestoreService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Firestore not available"]) 
		#endif
	}
}
