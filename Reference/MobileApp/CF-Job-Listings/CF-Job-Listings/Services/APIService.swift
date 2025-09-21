import Foundation

final class APIService {
	static let shared = APIService()
	private init() {}

	private var baseURL: URL { AppConfig.shared.apiBaseURL }

	func fetchJobs() async throws -> [Job] {
		// GET {API_BASE_URL}/api/jobs-data
		let url = baseURL.appendingPathComponent("api/jobs-data")
		var request = URLRequest(url: url)
		request.httpMethod = "GET"
		request.setValue("application/json", forHTTPHeaderField: "Accept")

		let (data, response) = try await URLSession.shared.data(for: request)
		guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
			throw NSError(domain: "APIService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to load jobs"])
		}

		// Response might be { jobs: [...] } or just [ ... ]
		if let wrapped = try? JSONDecoder().decode(JobsEnvelope.self, from: data) {
			return wrapped.jobs
		}
		if let direct = try? JSONDecoder().decode([Job].self, from: data) {
			return direct
		}
		throw NSError(domain: "APIService", code: 2, userInfo: [NSLocalizedDescriptionKey: "Unexpected jobs format"])
	}

	func submitApplication(_ payload: ApplicationPayload) async throws {
		let url = baseURL.appendingPathComponent("api/apply")
		var request = URLRequest(url: url)
		request.httpMethod = "POST"
		request.setValue("application/json", forHTTPHeaderField: "Content-Type")
		request.httpBody = try JSONEncoder().encode(payload)

		let (_, response) = try await URLSession.shared.data(for: request)
		guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
			throw NSError(domain: "APIService", code: 3, userInfo: [NSLocalizedDescriptionKey: "Application submit failed"])
		}
	}
}

private struct JobsEnvelope: Decodable {
	let jobs: [Job]
}
