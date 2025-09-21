import SwiftUI
import PhotosUI

struct UserPortalView: View {
	@StateObject private var auth = AuthService.shared
	@State private var email: String = ""
	@State private var password: String = ""
	@State private var record: UserRecord?
	@State private var notifications: [NotificationItem] = []
	@State private var isLoading = false
	@State private var errorMessage: String?
	@State private var contractFiles: [StorageService.ContractFile] = []
	@StateObject private var vm = PortalViewModel()
	@State private var showEditProfile = false
	@State private var editLocation = ""
	@State private var editRole = ""
	@State private var equipment: [EquipmentItem] = []
	@State private var assignedJobs: [AssignedJob] = []
	@State private var projects: [ProjectShowcaseItem] = []
	@State private var community: [CommunityPost] = []
	@State private var performance: [PerformanceEntry] = []
	@State private var newCommunityMessage = ""
    @State private var photoItem: PhotosPickerItem?
    @State private var isUploadingAvatar = false

	var body: some View {
		NavigationStack {
			ZStack(alignment: .top) {
				CFTheme.background.ignoresSafeArea()
				ScrollView {
					VStack(spacing: 16) {
						Text("Creator Portal").cfHeaderStyle()
						if !auth.isAuthenticated {
							CFCard {
								VStack(spacing: 12) {
									TextField("Email", text: $email).keyboardType(.emailAddress).textContentType(.username)
									SecureField("Password", text: $password).textContentType(.password)
									Button("Sign In") { signIn() }.buttonStyle(CFPrimaryButtonStyle())
									Button("Forgot Password?") { Task { try? await auth.resetPassword(email: email) } }
										.font(.footnote)
										.foregroundColor(.white)
									if let errorMessage { Text(errorMessage).foregroundColor(CFTheme.error) }
								}
							}
						}

						if auth.isAuthenticated, record == nil {
							ProgressView("Loading your portal...")
						}

						if auth.isAuthenticated, let rec = record {
							CFCard {
								VStack(alignment: .leading, spacing: 8) {
									Text("Profile").cfSectionHeader()
                                    HStack(spacing: 12) {
                                        let avatarURLString = rec.profile?.profilePicture ?? rec.profilePicture
                                        if let urlStr = avatarURLString, let url = URL(string: urlStr) {
                                            AsyncImage(url: url) { phase in
                                                if let image = phase.image { image.resizable().scaledToFill() } else { Color.gray.opacity(0.2) }
                                            }
                                            .frame(width: 44, height: 44)
                                            .clipShape(Circle())
                                        } else {
                                            Image(systemName: "person.circle.fill").resizable().frame(width: 44, height: 44).foregroundColor(.white.opacity(0.6))
                                        }
                                        VStack(alignment: .leading) {
                                            Text(rec.name ?? "").font(.headline)
                                            Label(rec.profile?.email ?? "", systemImage: "envelope")
                                            Label(rec.profile?.location ?? "", systemImage: "mappin.and.ellipse")
                                        }
                                        Spacer()
                                        PhotosPicker(selection: $photoItem, matching: .images, photoLibrary: .shared()) {
                                            Label(isUploadingAvatar ? "Uploading…" : "Change", systemImage: "arrow.triangle.2.circlepath")
                                                .padding(8)
                                                .background(Color.white.opacity(0.08))
                                                .cornerRadius(8)
                                        }.disabled(isUploadingAvatar)
                                    }
									Button("Edit Profile") {
										editLocation = rec.profile?.location ?? ""
										editRole = rec.profile?.role ?? ""
										showEditProfile = true
									}
									.buttonStyle(CFPrimaryButtonStyle())
								}
							}

							CFCard {
								VStack(alignment: .leading, spacing: 8) {
									Text("Jobs").cfSectionHeader()
									if !assignedJobs.isEmpty {
										ForEach(assignedJobs) { job in
											VStack(alignment: .leading, spacing: 6) {
												Text(job.title).font(.headline)
												if let loc = job.location, !loc.isEmpty { Label(loc, systemImage: "mappin.and.ellipse") }
												if let date = job.date, !date.isEmpty { Label(date, systemImage: "calendar") }
												if let pay = job.pay, !pay.isEmpty { Label(pay, systemImage: "dollarsign.circle") }
											}
											.padding(.vertical, 6)
											Divider()
										}
									} else if let jobs = rec.jobs, !jobs.isEmpty {
										ForEach(jobs.keys.sorted(), id: \.self) { key in
											if let job = rec.jobs?[key] {
												VStack(alignment: .leading, spacing: 6) {
													Text(job.title ?? job.jobTitle ?? "Assigned Role").font(.headline)
													Label(job.location ?? "", systemImage: "mappin.and.ellipse")
													Label(job.date ?? "", systemImage: "calendar")
													if let pay = (job.pay ?? job.rate), !pay.isEmpty { Label(pay, systemImage: "dollarsign.circle") }
													HStack {
														Button("Accept") { Task { await vm.acceptJob(key) } }
															.buttonStyle(CFPrimaryButtonStyle())
														Button("Decline") { Task { await vm.declineJob(key) } }
													}
												}
												.padding(.vertical, 6)
												Divider()
											}
										}
									} else {
										Text("No jobs assigned yet.").foregroundColor(.secondary)
									}
								}
							}

							CFCard {
								VStack(alignment: .leading, spacing: 8) {
									Text("Contracts").cfSectionHeader()
									if contractFiles.isEmpty {
										Text("No contracts found.").foregroundColor(.secondary)
									} else {
										ForEach(contractFiles, id: \.id) { f in
											Link(f.name, destination: f.url)
											Divider()
										}
									}
								}
							}

							CFCard {
								VStack(alignment: .leading, spacing: 8) {
									Text("Equipment Center").cfSectionHeader()
									if equipment.isEmpty {
										Text("No equipment available.").foregroundColor(.secondary)
									} else {
										ForEach(equipment) { item in
											HStack {
												Text(item.name)
												Spacer()
												if item.available { Button("Reserve") { Task { try? await PortalDataService.reserveEquipment(id: item.id, userEmail: rec.profile?.email ?? "") } } } else { Text(item.status ?? "Reserved").foregroundColor(.secondary) }
											}
											Divider()
										}
									}
								}
							}

							CFCard {
								VStack(alignment: .leading, spacing: 8) {
									Text("Project Showcase").cfSectionHeader()
									if projects.isEmpty { Text("No projects.").foregroundColor(.secondary) }
									ForEach(projects) { p in
										Text(p.title)
										Divider()
									}
								}
							}

							CFCard {
								VStack(alignment: .leading, spacing: 8) {
									Text("Community").cfSectionHeader()
									VStack(alignment: .leading, spacing: 6) {
										TextField("Share an update...", text: $newCommunityMessage)
										Button("Post") { Task { if !newCommunityMessage.isEmpty { try? await PortalDataService.addCommunityPost(author: rec.profile?.email ?? "", message: newCommunityMessage); newCommunityMessage = ""; community = await PortalDataService.fetchCommunity() } } }
									}
									ForEach(community) { post in
										VStack(alignment: .leading) {
											Text(post.author).font(.caption).foregroundColor(.secondary)
											Text(post.message)
										}
										Divider()
									}
								}
							}

							CFCard {
								VStack(alignment: .leading, spacing: 8) {
									Text("Performance Review").cfSectionHeader()
									if performance.isEmpty { Text("No data.").foregroundColor(.secondary) }
									ForEach(performance) { e in
										HStack { Text(e.metric); Spacer(); Text(e.value).foregroundColor(.secondary) }
										Divider()
									}
								}
							}

						}
					}
					.padding()
				}
			}
			.navigationTitle("Portal")
			.toolbar {
				ToolbarItem(placement: .navigationBarTrailing) {
					if auth.isAuthenticated { Button("Logout") { Task { await vm.logout() } } }
				}
			}
		}
		.sheet(isPresented: $showEditProfile) {
			NavigationStack {
				Form {
					Section("Profile") {
						TextField("Location", text: $editLocation)
						TextField("Role", text: $editRole)
					}
				}
				.navigationTitle("Edit Profile")
				.toolbar {
					ToolbarItem(placement: .cancellationAction) { Button("Cancel") { showEditProfile = false } }
					ToolbarItem(placement: .confirmationAction) { Button("Save") { Task { await vm.updateProfile(location: editLocation, role: editRole); showEditProfile = false } } }
				}
			}
		}
        .onChange(of: photoItem) { oldValue, newValue in
            guard newValue != nil else { return }
            Task { await uploadAvatar() }
        }
	}

	private func signIn() {
		Task {
			guard !email.isEmpty, !password.isEmpty else { errorMessage = "Enter email and password"; return }
			isLoading = true
			errorMessage = nil
			defer { isLoading = false }
			do {
				try await auth.signIn(email: email, password: password)
				// Start listeners and load data
				await vm.start(email: email)
				UserService.shared.listenUser(byEmail: email) { rec in
					Task { @MainActor in self.record = rec }
				}
				if let initial = try? await UserService.shared.fetchUser(byEmail: email) { self.record = initial }
				self.assignedJobs = await PortalDataService.fetchAssignedJobs(email: email, name: self.record?.name ?? "")
				self.notifications = (try? await UserService.shared.fetchNotifications()) ?? []
				self.contractFiles = (try? await StorageService.shared.listContracts(ownerEmail: email)) ?? []
				self.equipment = await PortalDataService.fetchEquipment()
				self.projects = await PortalDataService.fetchProjects()
				self.community = await PortalDataService.fetchCommunity()
				self.performance = await PortalDataService.fetchPerformance(email: email)
			} catch {
				errorMessage = (error as NSError).localizedDescription
			}
		}
	}
}

// MARK: - Avatar Upload
extension UserPortalView {
    private func uploadAvatar() async {
        guard let item = photoItem, let email = auth.currentEmail else { return }
        isUploadingAvatar = true
        defer { isUploadingAvatar = false }
        do {
            if let data = try await item.loadTransferable(type: Data.self) {
                let filename = "avatar.jpg"
                let result = try await StorageService.shared.uploadAvatar(data: data, ownerEmail: email, filename: filename, mime: "image/jpeg")
                await UserService.shared.updateProfilePicture(email: email, url: result.url.absoluteString, path: result.path)
                if let rec = try? await UserService.shared.fetchUser(byEmail: email) { await MainActor.run { self.record = rec } }
            }
        } catch { }
    }
}


