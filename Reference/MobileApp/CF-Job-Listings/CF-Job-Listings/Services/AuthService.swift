import Foundation
#if canImport(FirebaseAuth)
import FirebaseAuth
#endif

@MainActor
final class AuthService: ObservableObject {
	static let shared = AuthService()
	private init() {}

	@Published var currentEmail: String?
	@Published var isAuthenticated: Bool = false

	func signIn(email: String, password: String) async throws {
		#if canImport(FirebaseAuth)
		_ = try await Auth.auth().signIn(withEmail: email, password: password)
		self.currentEmail = email
		self.isAuthenticated = true
		#else
		throw NSError(domain: "AuthService", code: -1, userInfo: [NSLocalizedDescriptionKey: "FirebaseAuth not available"])
		#endif
	}

	func signOut() async {
		#if canImport(FirebaseAuth)
		try? Auth.auth().signOut()
		#endif
		self.currentEmail = nil
		self.isAuthenticated = false
	}

	func resetPassword(email: String) async throws {
		#if canImport(FirebaseAuth)
		try await Auth.auth().sendPasswordReset(withEmail: email)
		#else
		throw NSError(domain: "AuthService", code: -1, userInfo: [NSLocalizedDescriptionKey: "FirebaseAuth not available"])
		#endif
	}
}


