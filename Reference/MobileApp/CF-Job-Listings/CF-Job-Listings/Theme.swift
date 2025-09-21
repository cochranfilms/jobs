import SwiftUI

enum CFTheme {
	// Colors to match web palette
	static let primary = Color(red: 255/255, green: 178/255, blue: 0/255)
	static let primaryDark = Color(red: 255/255, green: 144/255, blue: 0/255)
	static let gold = Color(red: 255/255, green: 215/255, blue: 0/255)
	static let black = Color.black
	static let background = Color(red: 11/255, green: 11/255, blue: 16/255)
	static let card = Color.white.opacity(0.14)
	static let border = Color(red: 255/255, green: 178/255, blue: 0/255).opacity(0.28)
	static let success = Color(red: 34/255, green: 197/255, blue: 94/255)
	static let error = Color(red: 239/255, green: 68/255, blue: 68/255)
	static let blue = Color(red: 59/255, green: 130/255, blue: 246/255)
}

struct CFCard<Content: View>: View {
	let content: Content

	init(@ViewBuilder content: () -> Content) { self.content = content() }

	var body: some View {
		content
			.padding(16)
			.background(CFTheme.card)
			.overlay(
				RoundedRectangle(cornerRadius: 16)
					.stroke(CFTheme.border, lineWidth: 1)
			)
			.cornerRadius(16)
			.foregroundColor(.white)
	}
}

struct CFPrimaryButtonStyle: ButtonStyle {
	func makeBody(configuration: Configuration) -> some View {
		configuration.label
			.font(.headline)
			.foregroundColor(.black)
			.padding(.vertical, 12)
			.frame(maxWidth: .infinity)
			.background(
				RoundedRectangle(cornerRadius: 12)
					.fill(LinearGradient(colors: [CFTheme.primary, CFTheme.gold], startPoint: .topLeading, endPoint: .bottomTrailing))
			)
			.overlay(
				RoundedRectangle(cornerRadius: 12)
					.stroke(CFTheme.primary.opacity(0.45), lineWidth: 1)
			)
			.shadow(color: CFTheme.primary.opacity(0.25), radius: configuration.isPressed ? 4 : 12, x: 0, y: configuration.isPressed ? 2 : 8)
			.scaleEffect(configuration.isPressed ? 0.98 : 1.0)
	}
}

extension View {
	func cfHeaderStyle() -> some View {
		self
			.font(.largeTitle.bold())
			.foregroundColor(CFTheme.primary)
	}

	func cfSectionHeader() -> some View {
		self
			.font(.headline)
			.foregroundColor(CFTheme.primary)
	}

	func cfDarkScreen() -> some View {
		self
			.background(CFTheme.background.ignoresSafeArea())
			.foregroundColor(.white)
	}
}


