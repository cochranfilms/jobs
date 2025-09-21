import Foundation

struct ApplicationPayload: Encodable {
	let fullName: String
	let email: String
	let phone: String?
	let location: String?
	let applyingFor: String?
	let eventDate: String?
	let pay: String?
	let description: String?
	let portfolio: String?
	let source: String

	init(fullName: String,
		 email: String,
		 phone: String? = nil,
		 location: String? = nil,
		 applyingFor: String? = nil,
		 eventDate: String? = nil,
		 pay: String? = nil,
		 description: String? = nil,
		 portfolio: String? = nil,
		 source: String = "ios-app") {
		self.fullName = fullName
		self.email = email
		self.phone = phone
		self.location = location
		self.applyingFor = applyingFor
		self.eventDate = eventDate
		self.pay = pay
		self.description = description
		self.portfolio = portfolio
		self.source = source
	}
}
