import Foundation
#if canImport(FirebaseCore)
import FirebaseCore
#endif
#if canImport(FirebaseFirestore)
import FirebaseFirestore
#endif

@MainActor
final class PortalViewModel: ObservableObject {
	@Published var email: String?
	@Published var user: UserRecord?
	@Published var isLoading: Bool = false
	@Published var errorMessage: String?

	func start(email: String) async {
		self.email = email
		UserService.shared.listenUser(byEmail: email) { [weak self] rec in
			Task { @MainActor in self?.user = rec }
		}
		if let rec = try? await UserService.shared.fetchUser(byEmail: email) { self.user = rec }
	}

	func logout() async {
		await AuthService.shared.signOut()
		self.user = nil
		self.email = nil
	}

	func acceptJob(_ key: String) async {
		#if canImport(FirebaseFirestore)
		guard let docId = user?.name else { return }
		let db = Firestore.firestore()
		isLoading = true
		defer { isLoading = false }
		do {
			try await db.collection("users").document(docId).updateData(["jobs.\(key).status": "accepted"])
		} catch { errorMessage = (error as NSError).localizedDescription }
		#endif
	}

	func declineJob(_ key: String) async {
		#if canImport(FirebaseFirestore)
		guard let docId = user?.name else { return }
		let db = Firestore.firestore()
		isLoading = true
		defer { isLoading = false }
		do {
			try await db.collection("users").document(docId).updateData(["jobs.\(key).status": "declined"])
		} catch { errorMessage = (error as NSError).localizedDescription }
		#endif
	}

	func updateProfile(location: String?, role: String?) async {
		#if canImport(FirebaseFirestore)
		guard let docId = user?.name else { return }
		let db = Firestore.firestore()
		var updates: [String: Any] = [:]
		if let location { updates["profile.location"] = location }
		if let role { updates["profile.role"] = role }
		isLoading = true
		defer { isLoading = false }
		do { try await db.collection("users").document(docId).updateData(updates) } catch { errorMessage = (error as NSError).localizedDescription }
		#endif
	}
}


