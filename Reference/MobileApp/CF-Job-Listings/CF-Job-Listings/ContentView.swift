//
//  ContentView.swift
//  CF-Job-Listings
//
//  Created by Cody Cochran on 9/13/25.
//

import SwiftUI

struct ContentView: View {
	var body: some View {
		TabView {
			NavigationStack { JobListView() }
				.tabItem { Label("Jobs", systemImage: "list.bullet.rectangle") }
			NavigationStack { UserPortalView() }
				.tabItem { Label("Portal", systemImage: "person.crop.circle") }
			NavigationStack { TeamDirectoryView() }
				.tabItem { Label("Directory", systemImage: "person.3") }
			NavigationStack { CommunityView() }
				.tabItem { Label("Community", systemImage: "rectangle.3.group.bubble.left") }
			NavigationStack { PerformanceView() }
				.tabItem { Label("Performance", systemImage: "chart.line.uptrend.xyaxis") }
			NavigationStack { CalendarView() }
				.tabItem { Label("Calendar", systemImage: "calendar") }
			NavigationStack { AdminDashboardView() }
				.tabItem { Label("Admin", systemImage: "gearshape") }
			NavigationStack { MessagesView() }
				.tabItem { Label("Messages", systemImage: "bubble.left.and.bubble.right") }
			NavigationStack { NotificationsView() }
				.tabItem { Label("Alerts", systemImage: "bell") }
		}
	}
}

#Preview {
	ContentView()
}
