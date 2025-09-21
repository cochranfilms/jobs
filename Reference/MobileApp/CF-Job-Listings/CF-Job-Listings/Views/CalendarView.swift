import SwiftUI

struct CalendarView: View {
    @State private var selectedDate = Date()

    var body: some View {
        NavigationStack {
            VStack {
                DatePicker("Select Date", selection: $selectedDate, displayedComponents: [.date])
                    .datePickerStyle(.graphical)
                    .padding()
                Spacer()
            }
            .navigationTitle("Calendar")
        }
    }
}


