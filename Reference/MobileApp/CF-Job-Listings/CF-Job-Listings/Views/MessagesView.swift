import SwiftUI

struct MessagesView: View {
	@StateObject private var auth = AuthService.shared
	@StateObject private var service = MessagingService.shared
	@State private var selectedConv: Conversation?
	@State private var showNewMessageSheet = false
	@State private var recipientEmail = ""

	var body: some View {
		NavigationStack {
			List(service.conversations) { conv in
				Button {
					selectedConv = conv
				} label: {
					HStack {
						VStack(alignment: .leading) {
							Text(conv.participants.joined(separator: ", ")).font(.headline)
							Text(conv.lastMessage ?? "").font(.subheadline).foregroundColor(.secondary)
						}
						Spacer()
						if let ts = conv.lastMessageTime { Text(ts, style: .time).font(.caption).foregroundColor(.secondary) }
					}
				}
			}
			.navigationTitle("Messages")
			.toolbar {
				ToolbarItemGroup(placement: .navigationBarTrailing) {
					Button("New") { showNewMessageSheet = true }
				}
			}
		}
		.sheet(item: $selectedConv) { conv in
			ThreadView(conversation: conv)
		}
		.onAppear {
			if let email = auth.currentEmail { service.listenConversations(forEmail: email) }
		}
		.sheet(isPresented: $showNewMessageSheet) {
			NavigationStack {
				Form {
					Section("Start Conversation") {
						TextField("Recipient email", text: $recipientEmail).keyboardType(.emailAddress)
						HStack {
							Button("Admin") { Task { await startAdmin() } }
							Spacer()
							Button("Start") { Task { await startDirect() } }
						}
					}
				}
				.navigationTitle("New Message")
			}
		}
	}

	private func startAdmin() async {
		guard let me = auth.currentEmail else { return }
		do {
			let id = try await service.getOrCreateAdminConversation(currentEmail: me)
			await MainActor.run { selectedConv = service.conversations.first { $0.id == id } ?? Conversation(id: id, participants: [me, "admin"], jobId: nil, lastMessage: nil, lastMessageTime: nil, isActive: true, unreadCount: nil); showNewMessageSheet = false }
		} catch { }
	}

	private func startDirect() async {
		guard let me = auth.currentEmail, !recipientEmail.isEmpty else { return }
		do {
			let id = try await service.getOrCreateUserConversation(currentEmail: me, otherEmail: recipientEmail)
			await MainActor.run { selectedConv = service.conversations.first { $0.id == id } ?? Conversation(id: id, participants: [me, recipientEmail], jobId: nil, lastMessage: nil, lastMessageTime: nil, isActive: true, unreadCount: nil); showNewMessageSheet = false }
		} catch { }
	}
}

struct ThreadView: View {
	let conversation: Conversation
	@State private var text: String = ""
	@StateObject private var auth = AuthService.shared

	var body: some View {
		NavigationStack {
			VStack {
				List(MessagingService.shared.threadMessages) { m in
					VStack(alignment: .leading, spacing: 2) {
						HStack {
							Text(m.senderId).font(.caption).foregroundColor(.secondary)
							Spacer()
							if let ts = m.timestamp { Text(ts, style: .time).font(.caption2).foregroundColor(.secondary) }
						}
						Text(m.content)
						if (m.senderId == auth.currentEmail) {
							Button("Delete") { Task { try? await MessagingService.shared.deleteMessage(conversationId: conversation.id, messageId: m.id, requesterEmail: auth.currentEmail ?? "") } }
							.font(.caption)
						}
					}
				}
				HStack {
					TextField("Message", text: $text)
						.textFieldStyle(.roundedBorder)
					Button("Send") { Task { await send() } }
				}
				.padding()
			}
			.navigationTitle("Chat")
		}
		.onAppear { MessagingService.shared.listenThread(conversation.id) }
	}

	private func send() async {
		guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
		guard let email = auth.currentEmail else { return }
		do { try await MessagingService.shared.sendMessage(conversationId: conversation.id, senderEmail: email, text: text); text = "" } catch { }
	}
}


