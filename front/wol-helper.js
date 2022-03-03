function addSeparators(macAddress) {
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += macAddress.slice(i * 2, i * 2 + 2);
        result += i !== 5 ? ":" : "";
    }
    return result;
}

function wakeMachine(macAddress) {
    return new Promise((resolve, reject) => {
        let apiWakeMachine = new XMLHttpRequest();
        apiWakeMachine.open("POST", `/api/wake/${macAddress}`);
        apiWakeMachine.addEventListener("load", () => {
            switch (apiWakeMachine.status) {
                case 200:
                    resolve();
                    break;
                case 400:
                    reject(new Error(JSON.parse(apiWakeMachine.responseText).message));
                    break;
            }
        });
        apiWakeMachine.addEventListener("error", reject);
        apiWakeMachine.send();
    });
}

function deleteMachine(macAddress) {
    return new Promise((resolve, reject) => {
        if (confirm(`Are you sure you want to delete the machine "${addSeparators(macAddress)}"`)) {
            let apiDeleteMachine = new XMLHttpRequest();
            apiDeleteMachine.open("DELETE", `/api/machine/${macAddress}`);
            apiDeleteMachine.addEventListener("load", () => {
                switch (apiDeleteMachine.status) {
                    case 200:
                        resolve();
                        break;
                    default:
                        reject(new Error(JSON.parse(apiDeleteMachine.responseText).message));
                }
            });
            apiDeleteMachine.addEventListener("error", reject);
            apiDeleteMachine.send();
        } else {
            reject("USER_CANCELLED");
        }
    });
}

function infoInput(editMachineWithMACAddress) {
    return new Promise((resolve, reject) => {
        let nameCell = document.createElement("td");
        let nameInput = document.createElement("input");
        nameInput.size = 15;
        nameInput.placeholder = "Name";
        nameCell.appendChild(nameInput);

        let macAddrCell = document.createElement("td");
        let macAddrInput = document.createElement("input");
        macAddrInput.minLength = 12;
        macAddrInput.maxLength = 17;
        macAddrInput.size = 17;
        macAddrInput.placeholder = "aa:bb:cc:dd:ee:ff";
        macAddrCell.appendChild(macAddrInput);

        let ipAddrCell = document.createElement("td");
        let ipAddrInput = document.createElement("input");
        ipAddrInput.minLength = 7;
        ipAddrInput.maxLength = 15;
        ipAddrInput.size = 15;
        ipAddrInput.placeholder = "0.0.0.0";
        ipAddrCell.appendChild(ipAddrInput);
        let slash = document.createElement("span");
        slash.innerHTML = "&#47;";
        ipAddrCell.appendChild(slash);
        let subnetLengthInput = document.createElement("input");
        subnetLengthInput.type = "number";
        subnetLengthInput.min = "1";
        subnetLengthInput.max = "31";
        subnetLengthInput.step = "1";
        subnetLengthInput.size = 2;
        subnetLengthInput.defaultValue = "24";
        ipAddrCell.appendChild(subnetLengthInput);

        let operationCell = document.createElement("td");
        let commitButton = document.createElement("button");
        commitButton.innerHTML = "Commit";
        commitButton.classList.add("btn-item-edit");
        operationCell.appendChild(commitButton);
        let cancelButton = document.createElement("button");
        cancelButton.onclick = () => {
            reject("USER_CANCELLED");
        };
        cancelButton.innerHTML = "Cancel";
        cancelButton.classList.add("btn-item-edit");
        operationCell.appendChild(cancelButton);

        let row;
        let apiPostMachine = new XMLHttpRequest();
        if (!editMachineWithMACAddress) {
            row = document.createElement("tr");
            row.classList.add("info-input");
            row.appendChild(nameCell);
            row.appendChild(macAddrCell);
            row.appendChild(ipAddrCell);
            row.appendChild(operationCell);
            apiPostMachine.open("POST", "/api/machine");
            apiPostMachine.setRequestHeader("Content-Type", "application/json");
            apiPostMachine.addEventListener("load", () => {
                switch (apiPostMachine.status) {
                    case 201:
                        resolve();
                        break;
                    default:
                        reject(new Error(JSON.parse(apiPostMachine.responseText).message));
                }
            });
            apiPostMachine.addEventListener("error", reject);
            document.querySelector("table#machine-list > tbody").appendChild(row);
        } else {
            let machineInfo;
            document.querySelectorAll("table#machine-list > tbody > tr").forEach(element => {
                let info = JSON.parse(element.dataset.machineInfo);
                if (info.macAddress === editMachineWithMACAddress) {
                    machineInfo = info;
                    row = element;
                }
            });
            row.innerHTML = "";
            macAddrInput.value = addSeparators(machineInfo.macAddress);
            if (machineInfo.name) {
                nameInput.value = machineInfo.name;
            }
            if (machineInfo.ipAddress) {
                ipAddrInput.value = machineInfo.ipAddress.split("/")[0];
                subnetLengthInput.value = machineInfo.ipAddress.split("/")[1];
            }
            row.appendChild(nameCell);
            row.appendChild(macAddrCell);
            row.appendChild(ipAddrCell);
            row.appendChild(operationCell);
            apiPostMachine.open("PUT", `/api/machine/${machineInfo.macAddress}`);
            apiPostMachine.setRequestHeader("Content-Type", "application/json");
            apiPostMachine.addEventListener("load", () => {
                switch (apiPostMachine.status) {
                    case 200:
                        resolve();
                        break;
                    default:
                        reject(new Error(JSON.parse(apiPostMachine.responseText).message));
                }
            });
            apiPostMachine.addEventListener("error", reject);
        }
        commitButton.onclick = () => {
            let requestBody = {macAddress: macAddrInput.value};
            if (nameInput.value) {
                requestBody.name = nameInput.value;
            }
            if (ipAddrInput.value) {
                requestBody.ipAddress = `${ipAddrInput.value}/${subnetLengthInput.value}`;
            }
            apiPostMachine.send(JSON.stringify(requestBody));
        };
    });
}

function setOperationStatus(status) {
    switch (status) {
        case "idle":
            document.querySelector("table#machine-list").dataset.operationStatus = "wake";
            document.querySelector("table#machine-list thead th:nth-child(4)").innerHTML = "Wake";
            document.querySelector("a.operation-link#op-edit").innerHTML = "Edit";
            document.querySelector("a.operation-link#op-add").classList.remove("not-available");
            document.querySelector("a.operation-link#op-edit").classList.remove("not-available");
            break;
        case "edit":
            document.querySelector("table#machine-list").dataset.operationStatus = "edit";
            document.querySelector("table#machine-list thead th:nth-child(4)").innerHTML = "Operation";
            document.querySelector("a.operation-link#op-edit").innerHTML = "Finish";
            document.querySelector("a.operation-link#op-add").classList.add("not-available");
            document.querySelector("a.operation-link#op-edit").classList.remove("not-available");
            break;
        case "item-edit":
            document.querySelector("table#machine-list").dataset.operationStatus = "item-edit";
            document.querySelector("table#machine-list thead th:nth-child(4)").innerHTML = "Operation";
            document.querySelector("a.operation-link#op-add").classList.add("not-available");
            document.querySelector("a.operation-link#op-edit").classList.add("not-available");
            break;
    }
}

function refresh() {
    document.querySelector("table#machine-list > tbody").innerHTML = "";
    let apiGetAllMachines = new XMLHttpRequest();
    apiGetAllMachines.open("GET", "/api/machine");
    apiGetAllMachines.addEventListener("load", () => {
        let machines = JSON.parse(apiGetAllMachines.responseText);
        machines.forEach(machine => {
            let tableRow = document.createElement("tr");
            tableRow.dataset.machineInfo = JSON.stringify(machine);

            let nameCell = document.createElement("th");
            nameCell.scope = "row";
            if (machine.name) {
                nameCell.innerHTML = machine.name;
            } else {
                nameCell.innerHTML = "Unknown";
                nameCell.classList.add("no-data");
            }
            tableRow.appendChild(nameCell);

            let macAddrCell = document.createElement("td");
            macAddrCell.innerHTML = addSeparators(machine.macAddress);
            tableRow.appendChild(macAddrCell);

            let ipAddrCell = document.createElement("td");
            if (machine.ipAddress) {
                ipAddrCell.innerHTML = machine.ipAddress.split("/")[0];
            } else {
                ipAddrCell.innerHTML = "Unknown";
                ipAddrCell.classList.add("no-data");
            }
            tableRow.appendChild(ipAddrCell);

            let operationCell = document.createElement("td");
            let wakeButton = document.createElement("button");
            wakeButton.onclick = () => {
                wakeMachine(machine.macAddress).then(() => {
                    wakeButton.disabled = true;
                    setTimeout(() => {
                        wakeButton.disabled = false;
                    }, 5000);
                }).catch(() => {
                    window.alert("Failed to send the wake-up request.");
                });
            };
            wakeButton.innerHTML = "Wake";
            wakeButton.classList.add("btn-wake");
            operationCell.appendChild(wakeButton);

            let editButton = document.createElement("button");
            editButton.onclick = () => {
                setOperationStatus("item-edit");
                infoInput(machine.macAddress).catch(error => {
                    if (error !== "USER_CANCELLED") {
                        window.alert(`Failed to update the machine's information. Detail: ${error.message}`);
                    }
                }).then(() => {
                    setOperationStatus("idle");
                    refresh();
                });
            };
            editButton.innerHTML = "Edit";
            editButton.classList.add("btn-edit");
            operationCell.appendChild(editButton);

            let deleteButton = document.createElement("button");
            deleteButton.onclick = () => {
                deleteMachine(machine.macAddress).then(() => {
                    toggleEdit();
                    refresh();
                }).catch(reason => {
                    if (reason !== "USER_CANCELLED") {
                        window.alert("Failed to delete the machine.");
                    }
                    toggleEdit();
                });
            };
            deleteButton.innerHTML = "Delete";
            deleteButton.classList.add("btn-edit");
            operationCell.appendChild(deleteButton);

            tableRow.appendChild(operationCell);

            document.querySelector("table#machine-list > tbody").appendChild(tableRow);
        });
    });

    apiGetAllMachines.send();
}

function addMachine() {
    if (document.querySelector("table#machine-list").dataset.operationStatus === "wake") {
        setOperationStatus("item-edit");
        infoInput().then(() => {
            refresh();
        }).catch(error => {
            if (error !== "USER_CANCELLED") {
                alert(`Failed to add machine. Detail: ${error.message}`);
            } else {
                document.querySelector("table#machine-list > tbody > tr.info-input").remove();
            }
        }).then(() => {
            setOperationStatus("idle");
        });
    }
}

function toggleEdit() {
    if (document.querySelector("table#machine-list").dataset.operationStatus === "wake") {
        setOperationStatus("edit");
    } else if (document.querySelector("table#machine-list").dataset.operationStatus === "edit") {
        setOperationStatus("idle");
    }
}

refresh();
