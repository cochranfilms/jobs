//
//  CF_Job_ListingsApp.swift
//  CF-Job-Listings
//
//  Created by Cody Cochran on 9/13/25.
//

import SwiftUI
#if canImport(FirebaseCore)
import FirebaseCore
#endif
import os.log

@main
struct CF_Job_ListingsApp: App {
	@UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
	init() {
		#if canImport(FirebaseCore)
		if FirebaseApp.app() == nil { FirebaseApp.configure() }
		#endif
	}

	var body: some Scene {
		WindowGroup { ContentView() }
	}
}
