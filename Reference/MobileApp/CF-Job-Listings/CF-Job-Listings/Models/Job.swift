import Foundation

struct Job: Identifiable, Decodable, Hashable {
	let id: String?
	let title: String?
	let role: String?
	let location: String?
	let description: String?
	let date: String?
	let projectStart: String?
	let pay: String?
	let rate: String?
	let active: Bool?
	let status: String?

	var displayTitle: String {
		let raw = (title?.isEmpty == false ? title : role) ?? "Project"
		return raw
	}

	var displayPay: String {
		(pay?.isEmpty == false ? pay : rate) ?? ""
	}

	var displayDate: String {
		(date?.isEmpty == false ? date : projectStart) ?? ""
	}

	var normalizedStatus: String {
		(status ?? "")
			.lowercased()
			.replacingOccurrences(of: "\"", with: "")
			.trimmingCharacters(in: .whitespacesAndNewlines)
	}

	var isActive: Bool {
		if let active = active { return active }
		let s = normalizedStatus
		if s.isEmpty { return true }
		return s == "active"
	}

	private enum CodingKeys: String, CodingKey {
		case id
		case title
		case role
		case location
		case description
		case date
		case projectStart
		case pay
		case rate
		case active
		case status
	}
}
