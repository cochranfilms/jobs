import Foundation
import PDFKit
import UIKit

final class PDFService {
	static let shared = PDFService()
	private init() {}

	func generateContractPDF(contractId: String,
							freelancerName: String,
							freelancerEmail: String,
							role: String,
							location: String,
							projectStart: String,
							rate: String,
							effectiveDate: String,
							signature: String,
							signatureDate: String) -> Data? {
		let pdfMeta: [String: Any] = [
			kCGPDFContextCreator as String: "Cochran Films iOS",
			kCGPDFContextAuthor as String: "Cochran Films",
			kCGPDFContextTitle as String: "Freelance Contract"
		]
		// Use explicit Letter size to avoid zero/NaN page bounds in debug sessions
		let data = NSMutableData()
		let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792)
		UIGraphicsBeginPDFContextToData(data, pageRect, pdfMeta)
		UIGraphicsBeginPDFPageWithInfo(pageRect, pdfMeta)
		let ctx = UIGraphicsGetCurrentContext()

		// Header banner
		ctx?.setFillColor(UIColor(red: 1.0, green: 178/255.0, blue: 0, alpha: 1).cgColor)
		ctx?.fill(CGRect(x: 0, y: 0, width: pageRect.width, height: 60))

		let title = "COCHRAN FILMS\nFREELANCE CONTRACT AGREEMENT"
		(title as NSString).draw(in: CGRect(x: 24, y: 14, width: pageRect.width-48, height: 44), withAttributes: [
			.font: UIFont.boldSystemFont(ofSize: 14), .foregroundColor: UIColor.black
		])

		var cursorY: CGFloat = 80
		func section(_ text: String) {
			(text as NSString).draw(in: CGRect(x: 24, y: cursorY, width: pageRect.width-48, height: 22), withAttributes: [ .font: UIFont.boldSystemFont(ofSize: 12), .foregroundColor: UIColor.black ])
			cursorY += 22
		}
		func line(_ key: String, _ value: String) {
			let keyAttr: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 11, weight: .semibold)]
			let valAttr: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 11)]
			(key as NSString).draw(at: CGPoint(x: 24, y: cursorY), withAttributes: keyAttr)
			(value as NSString).draw(at: CGPoint(x: 180, y: cursorY), withAttributes: valAttr)
			cursorY += 18
		}

		section("Contract Details")
		line("Contract ID:", contractId)
		line("Effective Date:", effectiveDate)

		cursorY += 8
		section("Contractor Information")
		line("Name:", freelancerName)
		line("Email:", freelancerEmail)
		line("Role:", role)
		line("Location:", location)

		cursorY += 8
		section("Project")
		line("Start:", projectStart)
		line("Rate:", rate)

		cursorY += 8
		section("Terms (Summary)")
		["Independent contractor", "Payment within 24 hours", "Professional standards", "Confidentiality", "Transportation by contractor"].forEach { term in
			("• \(term)" as NSString).draw(at: CGPoint(x: 24, y: cursorY), withAttributes: [.font: UIFont.systemFont(ofSize: 10)])
			cursorY += 14
		}

		cursorY += 8
		section("Signatures")
		line("Company:", "Cody Cochran (Founder & CEO)")
		line("Date:", effectiveDate)
		cursorY += 6
		line("Contractor:", freelancerName)
		line("Signature:", signature)
		line("Date:", signatureDate)

		UIGraphicsEndPDFContext()
		return data as Data
	}
}


