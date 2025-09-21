import SwiftUI
import PhotosUI

struct CommunityView: View {
    @State private var successStories: [[String: Any]] = []
    @State private var showcases: [ProjectShowcaseItem] = []
    @State private var pickerItem: PhotosPickerItem?
    @State private var isUploading = false
    @StateObject private var auth = AuthService.shared

    var body: some View {
        NavigationStack {
            List {
                Section("Success Stories") {
                    if successStories.isEmpty { Text("No stories yet").foregroundColor(.secondary) }
                    ForEach(Array(successStories.enumerated()), id: \.0) { _, story in
                        VStack(alignment: .leading) {
                            Text((story["title"] as? String) ?? "Story").font(.headline)
                            Text((story["description"] as? String) ?? "").font(.subheadline)
                        }
                    }
                }
                Section("Showcases") {
                    if showcases.isEmpty { Text("No showcases yet").foregroundColor(.secondary) }
                    ForEach(showcases) { s in
                        VStack(alignment: .leading) { Text(s.title); if let url = s.mediaURL, let u = URL(string: url) { Link("Open", destination: u) } }
                    }
                    HStack {
                        PhotosPicker(selection: $pickerItem, matching: .images) {
                            Label(isUploading ? "Uploading…" : "Upload Showcase", systemImage: "square.and.arrow.up")
                        }.disabled(isUploading || !auth.isAuthenticated)
                    }
                }
            }
            .navigationTitle("Community")
        }
        .onAppear { Task { await reload() } }
        .onChange(of: pickerItem) { oldValue, newValue in
            guard newValue != nil else { return }
            Task { await uploadShowcase() }
        }
    }

    private func reload() async {
        successStories = await PortalDataService.fetchSuccessStories()
        showcases = await PortalDataService.fetchProjects()
    }

    private func uploadShowcase() async {
        guard let item = pickerItem, let email = auth.currentEmail else { return }
        isUploading = true; defer { isUploading = false }
        do {
            if let data = try await item.loadTransferable(type: Data.self) {
                let url = try await PortalDataService.uploadShowcase(ownerEmail: email, data: data, filename: "image.jpg", mime: "image/jpeg")
                showcases.insert(ProjectShowcaseItem(id: UUID().uuidString, title: "Upload", mediaURL: url), at: 0)
            }
        } catch { }
    }
}


