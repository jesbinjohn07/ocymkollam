const programs = [
  { name: "ലളിതഗാനം", count: 1 },
  { name: "സമൂഹഗാനം", count: 3 },
  { name: "സോപോകരണ സമൂഹഗാനം", count: 7 },
  { name: "പ്രസംഗം", count: 1 },
  { name: "കഥാപ്രസംഗം", count: 1 },
  { name: "സ്ടിറിംഗ് ഇൻസ്ട്രമെൻ്റ്", count: 1 },
  { name: "കീബോർഡ്", count: 1 },
  { name: "തബല", count: 1 },
  { name: "ഉപന്യാസം", count: 1 },
  { name: "ചിത്രരചന", count: 1 },
  { name: "കഥാരചന", count: 1 },
  { name: "കവിതാരചന", count: 1 },
  { name: "മാർഗംകളി", count: 8 },
  { name: "പരിചമുട്ട് കളി", count: 8 },
  { name: "തെരുവ് നാടകം", count: 10 },
  { name: "ക്വിസ്", count: 3 },
  { name: "മൈം", count: 7 }
];

function addItem() {
  const container = document.getElementById("itemsContainer");
  const div = document.createElement("div");
  div.className = "item-block";

  let options = `<option value="">Select Program</option>`;
  programs.forEach((p, i) => {
    options += `<option value="${i}">${p.name} (${p.count})</option>`;
  });

  div.innerHTML = `
      <label>Item Program</label>
      <select onchange="generateParticipants(this)" required>
        ${options}
      </select>

      <div class="participants"></div>
      <button type="button" onclick="this.parentElement.remove()">❌ Remove</button>
  `;

  container.appendChild(div);
}

function generateParticipants(select) {
  const index = select.value;
  const participantBox = select.parentElement.querySelector(".participants");
  participantBox.innerHTML = "";

  // Prevent duplicate selection
  const selectedValues = Array.from(
    document.querySelectorAll("#itemsContainer select")
  ).map(s => s.value);

  if (selectedValues.filter(v => v === index).length > 1) {
    alert("This item is already selected!");
    select.value = "";
    return;
  }

  if (index === "") return;

  const count = programs[index].count;

  for (let i = 1; i <= count; i++) {
    participantBox.innerHTML += `
      <input type="text" placeholder="Participant ${i} Name" required>
    `;
  }
}

