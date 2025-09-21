import SwiftUI

struct TeamDirectoryView: View {
	@State private var search: String = ""
	@State private var role: String = ""
	@State private var team: [TeamUser] = []

	var body: some View {
		NavigationStack {
			VStack {
				HStack {
					TextField("Search team members", text: $search)
						.textFieldStyle(.roundedBorder)
					Picker("Role", selection: $role) {
						Text("All").tag("")
						Text("Photographer").tag("Photographer")
						Text("Videographer").tag("Videographer")
						Text("Editor").tag("Editor")
						Text("Assistant").tag("Assistant")
					}
					.pickerStyle(.menu)
				}
				.padding([.horizontal,.top])
				List(filtered) { user in
					HStack(spacing: 12) {
						if let pic = user.profilePicture, let url = URL(string: pic) {
							AsyncImage(url: url) { phase in
								if let img = phase.image { img.resizable().scaledToFill() } else { Color.gray.opacity(0.2) }
							}
							.frame(width: 40, height: 40).clipShape(Circle())
						} else {
							Image(systemName: "person.circle.fill").resizable().frame(width: 40, height: 40).foregroundColor(.white.opacity(0.6))
						}
						VStack(alignment: .leading) {
							Text(user.name ?? "").font(.headline)
							Text(user.email ?? "").font(.caption).foregroundColor(.secondary)
						}
						Spacer()
						Text(user.role ?? "").font(.caption).foregroundColor(.secondary)
					}
				}
			}
			.navigationTitle("Team Directory")
		}
		.onAppear { Task { team = await UserService.shared.fetchTeam() } }
	}

	private var filtered: [TeamUser] {
		team.filter { user in
			let matchesSearch = search.isEmpty || (user.name ?? "").localizedCaseInsensitiveContains(search) || (user.email ?? "").localizedCaseInsensitiveContains(search)
			let matchesRole = role.isEmpty || (user.role ?? "").localizedCaseInsensitiveContains(role)
			return matchesSearch && matchesRole
		}
	}
}
