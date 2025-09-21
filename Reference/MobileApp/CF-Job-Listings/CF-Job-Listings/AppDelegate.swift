import UIKit
#if canImport(FirebaseCore)
import FirebaseCore
#endif

class AppDelegate: NSObject, UIApplicationDelegate {
	func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
		#if canImport(FirebaseCore)
		if FirebaseApp.app() == nil {
			FirebaseApp.configure()
		}
		#endif
		return true
	}
}


