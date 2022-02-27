function wake(macAddress) {
    return new Promise((resolve, reject) => {
        let apiWakeMachine = new XMLHttpRequest();
        apiWakeMachine.open("POST", `/api/wake/${macAddress}`);
        apiWakeMachine.addEventListener("load", resolve);
        apiWakeMachine.addEventListener("error", reject);
        apiWakeMachine.send();
    });
}

function refresh() {
    document.querySelector("table#machine-list > tbody").innerHTML = "";
    let apiGetAllMachines = new XMLHttpRequest();
    apiGetAllMachines.open("GET", "/api/machine");
    apiGetAllMachines.addEventListener("load", () => {
        let machines = JSON.parse(apiGetAllMachines.responseText);
        machines.forEach(machine => {
            let tableRow = document.createElement("tr");

            let nameCell = document.createElement("th");
            nameCell.scope = "row";
            if (machine.name) {
                nameCell.innerHTML = machine.name
            } else {
                nameCell.innerHTML = "Unknown";
                nameCell.classList.add("no-data");
            }
            tableRow.appendChild(nameCell);

            let macAddrCell = document.createElement("td");
            for (let i = 0; i < 6; i++) {
                macAddrCell.innerHTML += machine.macAddress.slice(i * 2, i * 2 + 2);
                macAddrCell.innerHTML += i !== 5 ? ":" : "";
            }
            tableRow.appendChild(macAddrCell);

            let ipAddrCell = document.createElement("td");
            if (machine.ipAddress) {
                ipAddrCell.innerHTML = machine.ipAddress.split("/")[0];
            } else {
                ipAddrCell.innerHTML = "Unknown";
                ipAddrCell.classList.add("no-data");
            }
            tableRow.appendChild(ipAddrCell);

            let wakeOperationCell = document.createElement("td");
            let wakeButton = document.createElement("button");
            wakeButton.onclick = () => {
                wake(machine.macAddress).then(() => {
                    wakeButton.disabled = true;
                    setTimeout(() => {
                        wakeButton.disabled = false;
                    }, 5000);
                }).catch(() => {
                    window.alert("Failed to send the wake-up request.");
                });
            };
            wakeButton.innerHTML = "Wake";
            wakeOperationCell.appendChild(wakeButton);
            tableRow.appendChild(wakeOperationCell);

            document.querySelector("table#machine-list > tbody").appendChild(tableRow);
        });
    });
    
    apiGetAllMachines.send();
}

refresh();
