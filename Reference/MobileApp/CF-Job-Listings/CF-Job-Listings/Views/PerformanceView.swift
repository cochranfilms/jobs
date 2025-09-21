import SwiftUI
import Charts

struct PerformanceView: View {
    @StateObject private var auth = AuthService.shared
    @State private var entries: [PerformanceEntry] = []

    var body: some View {
        NavigationStack {
            VStack {
                if entries.isEmpty {
                    Text("No data").foregroundColor(.secondary)
                } else {
                    Chart(entries.prefix(12)) { e in
                        if let v = Double(e.value) { BarMark(x: .value("Metric", e.metric), y: .value("Value", v)) }
                    }
                    .frame(height: 220)
                    List(entries) { e in
                        HStack { Text(e.metric); Spacer(); Text(e.value).foregroundColor(.secondary) }
                    }
                }
            }
            .navigationTitle("Performance")
        }
        .onAppear { Task { await load() } }
    }

    private func load() async {
        guard let email = auth.currentEmail else { return }
        entries = await PortalDataService.fetchPerformance(email: email)
    }
}


