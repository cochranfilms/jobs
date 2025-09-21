import Foundation

struct UserProfile: Codable, Hashable {
	var name: String?
	var email: String?
	var location: String?
	var role: String?
	var approvedDate: String?
	var profilePicture: String?
	var picturePath: String?
}

struct UserContract: Codable, Hashable {
	var contractStatus: String?
	var contractSignedDate: String?
	var contractUploadedDate: String?
	var contractId: String?
	var fileUrl: String?
}

struct UserJob: Codable, Hashable, Identifiable {
	var id: String { key ?? UUID().uuidString }
	var key: String?
	var title: String?
	var jobTitle: String?
	var location: String?
	var date: String?
	var pay: String?
	var rate: String?
	var status: String?
}

struct UserRecord: Codable, Hashable, Identifiable {
	var id: String { name ?? UUID().uuidString }
	var name: String?
	var profile: UserProfile?
	var contract: UserContract?
	var jobs: [String: UserJob]?
	var primaryJob: String?
	var application: [String: String]?
	// Fallback avatar if backend stores it at the root as well
	var profilePicture: String?
}

struct NotificationItem: Codable, Identifiable, Hashable {
	var id: Int
	var title: String
	var message: String
	var type: String
	var timestamp: String
	var read: Bool
}

struct TeamUser: Identifiable, Codable, Hashable {
	var id: String { email ?? UUID().uuidString }
	var name: String?
	var email: String?
	var role: String?
	var profilePicture: String?
}


