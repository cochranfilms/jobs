import Foundation
#if canImport(FirebaseCore)
import FirebaseCore
#endif
#if canImport(FirebaseFirestore)
import FirebaseFirestore
#endif
#if canImport(FirebaseStorage)
import FirebaseStorage
#endif

struct Conversation: Identifiable, Hashable, Codable {
	var id: String
	var participants: [String]
	var jobId: String?
	var lastMessage: String?
	var lastMessageTime: Date?
	var isActive: Bool?
	var unreadCount: Int? // client side computed
}

struct MessageItem: Identifiable, Hashable, Codable {
	var id: String
	var senderId: String
	var content: String
	var attachments: [String]?
	var timestamp: Date?
	var status: String?
}

@MainActor
final class MessagingService: ObservableObject {
	static let shared = MessagingService()
	private init() {}

	@Published var conversations: [Conversation] = []
	private var convListener: ListenerRegistration?
	private var msgListener: ListenerRegistration?
	@Published var threadMessages: [MessageItem] = []
	private let adminEmails: [String] = ["info@cochranfilms.com","cody@cochranfilms.com","admin@cochranfilms.com"]

	func listenConversations(forEmail email: String) {
		#if canImport(FirebaseFirestore)
		convListener?.remove()
		let db = Firestore.firestore()
		let ref = db.collection("directMessages").whereField("isActive", isEqualTo: true)
		convListener = ref.addSnapshotListener { [weak self] (snapshot: QuerySnapshot?, error: Error?) in
			guard let self = self else { return }
			var list: [Conversation] = []
			snapshot?.documents.forEach { doc in
				let data = doc.data()
				let participants = data["participants"] as? [String] ?? []
				let isBroadcast = participants.contains { $0.lowercased() == "broadcasts" }
				let include = participants.contains(email) || isBroadcast
				if include {
					let lastTs = (data["lastMessageTime"] as? Timestamp)?.dateValue()
					let c = Conversation(
						id: doc.documentID,
						participants: participants,
						jobId: data["jobId"] as? String,
						lastMessage: data["lastMessage"] as? String,
						lastMessageTime: lastTs,
						isActive: data["isActive"] as? Bool,
						unreadCount: nil
					)
					list.append(c)
				}
			}
			self.conversations = list.sorted { ($0.lastMessageTime ?? .distantPast) > ($1.lastMessageTime ?? .distantPast) }
		}
		#endif
	}

	func stopListening() {
		convListener?.remove(); convListener = nil
		msgListener?.remove(); msgListener = nil
	}

	func listenThread(_ conversationId: String) {
		#if canImport(FirebaseFirestore)
		msgListener?.remove(); msgListener = nil
		let db = Firestore.firestore()
		msgListener = db.collection("directMessages")
			.document(conversationId)
			.collection("messages")
			.order(by: "timestamp", descending: false)
			.addSnapshotListener { [weak self] (snap: QuerySnapshot?, error: Error?) in
				guard let self = self else { return }
				var items: [MessageItem] = []
				snap?.documents.forEach { d in
					let data = d.data()
					let ts = (data["timestamp"] as? Timestamp)?.dateValue()
					items.append(MessageItem(id: d.documentID, senderId: data["senderId"] as? String ?? "", content: data["content"] as? String ?? "", attachments: data["attachments"] as? [String], timestamp: ts, status: data["status"] as? String))
				}
				self.threadMessages = items
			}
		// Mark read for current user when opening
		if let email = AuthService.shared.currentEmail {
			Task { try? await markConversationRead(conversationId, email: email) }
		}
		#endif
	}

	func sendMessage(conversationId: String, senderEmail: String, text: String, attachments: [String] = []) async throws {
		#if canImport(FirebaseFirestore)
		let db = Firestore.firestore()
		let msgRef = db.collection("directMessages").document(conversationId).collection("messages").document()
		let payload: [String: Any] = [
			"id": msgRef.documentID,
			"senderId": senderEmail,
			"content": text,
			"attachments": attachments,
			"timestamp": FieldValue.serverTimestamp(),
			"status": "sent",
			"readBy": [senderEmail]
		]
		try await msgRef.setData(payload)
		try await db.collection("directMessages").document(conversationId).setData([
			"lastMessage": text,
			"lastMessageTime": FieldValue.serverTimestamp()
		], merge: true)
		#else
		throw NSError(domain: "MessagingService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Firestore not available"])
		#endif
	}

	func createConversation(participants: [String]) async throws -> String {
		#if canImport(FirebaseFirestore)
		let sorted = participants.sorted()
		let convId = sorted.joined(separator: "_").replacingOccurrences(of: "[^a-zA-Z0-9_]", with: "_", options: .regularExpression)
		let db = Firestore.firestore()
		try await db.collection("directMessages").document(convId).setData([
			"id": convId,
			"participants": sorted,
			"isActive": true,
			"createdAt": FieldValue.serverTimestamp()
		], merge: true)
		return convId
		#else
		throw NSError(domain: "MessagingService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Firestore not available"])
		#endif
	}

    func getOrCreateAdminConversation(currentEmail: String) async throws -> String {
        #if canImport(FirebaseFirestore)
        let primary = adminEmails.first ?? "admin@cochranfilms.com"
        return try await createConversation(participants: [currentEmail, primary])
        #else
        throw NSError(domain: "MessagingService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Firestore not available"])
        #endif
    }

    func getOrCreateUserConversation(currentEmail: String, otherEmail: String) async throws -> String {
        try await createConversation(participants: [currentEmail, otherEmail])
    }

    func deleteMessage(conversationId: String, messageId: String, requesterEmail: String) async throws {
        #if canImport(FirebaseFirestore)
        let db = Firestore.firestore()
        let ref = db.collection("directMessages").document(conversationId).collection("messages").document(messageId)
        let snap = try await ref.getDocument()
        if let sender = snap.data()? ["senderId"] as? String, sender == requesterEmail {
            try await ref.delete()
        } else {
            throw NSError(domain: "MessagingService", code: 403, userInfo: [NSLocalizedDescriptionKey: "Only the sender can delete their message."])
        }
        #endif
    }

    private func markConversationRead(_ conversationId: String, email: String) async throws {
        #if canImport(FirebaseFirestore)
        _ = try? await Firestore.firestore().collection("directMessages").document(conversationId).collection("messages").whereField("readBy", arrayContains: email).limit(to: 1).getDocuments()
        #endif
    }
}


