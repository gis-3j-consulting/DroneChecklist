window.selectedWeather = [];
let projectsList = [];
let selectedIndex = -1;
let checkedItems = [];

document.getElementById("incident-select").addEventListener("change", function() {
    incidentYN = document.getElementById("incident-select").value;

    if (incidentYN === "Yes") {
        document.getElementById("incident-description").style.display = "block";
    } else {
        document.getElementById("incident-description").style.display = "none";
    }
});

async function fetchProjects() {
    try {
        const response = await fetch('projects.csv');
        if (!response.ok) {
            throw new Error('Failed to load the CSV file.');
        }
        const data = await response.text();
        return data.split('\n').map(row => row.trim()).filter(row => row);
    } catch (error) {
        console.error('Error loading projects:', error);
        return [];
    }
}

function highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function autocomplete(input, suggestions) {
    const autocompleteList = document.getElementById('autocomplete-list');

    function showSuggestions(query) {
        selectedIndex = -1;
        let filteredSuggestions = suggestions
            .filter(item => item.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10);

        autocompleteList.innerHTML = '';
        
        if (!query || filteredSuggestions.length === 0) {
            autocompleteList.style.display = 'none';
            return;
        }

        filteredSuggestions.forEach((suggestion, index) => {
            let suggestionItem = document.createElement('div');
            suggestionItem.classList.add('autocomplete-suggestion');
            suggestionItem.innerHTML = highlightMatch(suggestion, query);
            suggestionItem.addEventListener('click', () => {
                input.value = suggestion;
                autocompleteList.style.display = 'none';
            });
            suggestionItem.addEventListener('mouseover', () => {
                selectedIndex = index;
                updateSelection();
            });
            autocompleteList.appendChild(suggestionItem);
        });

        autocompleteList.style.display = 'block';
    }

    function updateSelection() {
        const suggestions = autocompleteList.querySelectorAll('.autocomplete-suggestion');
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('selected', index === selectedIndex);
        });
    }

    input.addEventListener('input', () => showSuggestions(input.value));
    
    input.addEventListener('keydown', (e) => {
        const suggestions = autocompleteList.querySelectorAll('.autocomplete-suggestion');
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
                updateSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelection();
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    input.value = suggestions[selectedIndex].textContent;
                    autocompleteList.style.display = 'none';
                }
                break;
            case 'Escape':
                autocompleteList.style.display = 'none';
                break;
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !autocompleteList.contains(e.target)) {
            autocompleteList.style.display = 'none';
        }
    });
}

window.onload = async function () {
    projectsList = await fetchProjects();
    autocomplete(document.getElementById('project'), projectsList);
};

function getCurrentDateTime() {
    const currentDate = new Date();
    const date = currentDate.toISOString().split('T')[0];
    const time = currentDate.toTimeString().split(' ')[0].slice(0, 5);
    document.getElementById('Date').value = date;
    document.getElementById('time').value = time;
}

document.getElementById('get-date-time').addEventListener('click', getCurrentDateTime);

function toggleWeatherSelection(event) {
    const weatherIcon = event.target;
    const weatherValue = weatherIcon.getAttribute('data-weather');
    if (window.selectedWeather.includes(weatherValue)) {
        const index = window.selectedWeather.indexOf(weatherValue);
        window.selectedWeather.splice(index, 1);
        weatherIcon.classList.remove('active');
    } else {
        window.selectedWeather.push(weatherValue);
        weatherIcon.classList.add('active');
    }
    console.log('Selected weather conditions:', window.selectedWeather);
    return window.selectedWeather;
}

const weatherIcons = document.querySelectorAll('#weather-box i');
weatherIcons.forEach(icon => {
    icon.addEventListener('click', toggleWeatherSelection);
});

document.querySelectorAll('.item-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            this.parentElement.classList.add('highlight');

            checkedItems.push(this.name);

            setTimeout(() => {
                this.parentElement.classList.add('hidden');
            }, 1000);
        }
    });
});

function autoSave() {
    const formData = {
        inputs: {},
        checkboxes: {},
        selects: {},
        weather: [],
        coordinates: ''
    };

    document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], input[type="time"]').forEach(input => {
        formData.inputs[input.id] = input.value;
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        formData.checkboxes[checkbox.id] = {
            checked: checkbox.checked,
            hidden: checkbox.closest('.checklist-item').classList.contains('hidden')
        };
    });

    document.querySelectorAll('select').forEach(select => {
        formData.selects[select.id] = select.value;
    });

    document.querySelectorAll('#weather-box i.active').forEach(icon => {
        formData.weather.push(icon.getAttribute('data-weather'));
    });

    const coordsElement = document.getElementById('coordinates-description');
    if (coordsElement) {
        formData.coordinates = coordsElement.textContent;
    }

    localStorage.setItem('formData', JSON.stringify(formData));
}

function restoreData() {
    const savedData = localStorage.getItem('formData');
    if (savedData) {
        const formData = JSON.parse(savedData);

        Object.keys(formData.inputs).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.value = formData.inputs[key];
            }
        });

        Object.keys(formData.checkboxes).forEach(key => {
            const checkbox = document.getElementById(key);
            if (checkbox) {
                checkbox.checked = formData.checkboxes[key].checked;
                const checklistItem = checkbox.closest('.checklist-item');
                if (checklistItem && formData.checkboxes[key].hidden) {
                    checklistItem.classList.add('highlight', 'hidden');
                }
            }
        });

        Object.keys(formData.selects).forEach(key => {
            const select = document.getElementById(key);
            if (select) {
                select.value = formData.selects[key];
                if (key === 'incident-select') {
                    const event = new Event('change');
                    select.dispatchEvent(event);
                }
            }
        });

        document.querySelectorAll('#weather-box i').forEach(icon => {
            const weather = icon.getAttribute('data-weather');
            if (formData.weather.includes(weather)) {
                icon.classList.add('active');
                window.selectedWeather.push(weather);
            }
        });

        const coordsElement = document.getElementById('coordinates-description');
        if (coordsElement && formData.coordinates) {
            coordsElement.textContent = formData.coordinates;
        }
    }
}

const showAllButton = document.getElementById('show-all-button');
const clearAllButton = document.getElementById('clear-all-button');
const clearBelowButton = document.getElementById('clear-some-button');

function clearAll() {
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.value = '';
    });
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.value = '';
    });
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.value = '';
    });
    document.querySelectorAll('input[type="time"]').forEach(input => {
        input.value = '';
    });
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
        const checklistItem = checkbox.closest('.checklist-item');
        if (checklistItem) {
            checklistItem.classList.remove('highlight', 'hidden');
            checklistItem.style.display = 'flex';
        }
    });
    document.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
    });
    document.querySelectorAll('#weather-box i').forEach(icon => {
        icon.classList.remove('selected');
    });
    const coordsElement = document.getElementById('coordinates-description');
    if (coordsElement) {
        coordsElement.textContent = '';
    }
}

function clearBelow() {
    const subBox1 = document.getElementById('sub-box1');
    let currentElement = subBox1.nextElementSibling;

    while (currentElement) {
        currentElement.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
            const checklistItem = checkbox.closest('.checklist-item');
            if (checklistItem) {
                checklistItem.classList.remove('highlight', 'hidden');
                checklistItem.style.display = 'flex';
            }
        });
        currentElement.querySelectorAll('input[type="text"]').forEach(input => {
            input.value = '';
        });
        
        currentElement.querySelectorAll('input[type="number"]').forEach(input => {
            input.value = '';
        });
        currentElement.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });                
        currentElement = currentElement.nextElementSibling;
    }
}

function toggleCheckedItems() {
    const checkedItems = document.querySelectorAll('.checklist-item input[type="checkbox"]:checked');
    const buttonText = showAllButton.textContent;
    
    if (buttonText === 'Hide Checked Items') {
        checkedItems.forEach(item => {
            const checklistItem = item.closest('.checklist-item');
            if (checklistItem) {
                checklistItem.style.display = 'none';
            }
        });
        showAllButton.textContent = 'Show All Items';
    } else {
        document.querySelectorAll('.checklist-item').forEach(item => {
            item.style.display = 'flex';
        });
        showAllButton.textContent = 'Hide Checked Items';
    }
}

clearAllButton.addEventListener('click', clearAll);
clearBelowButton.addEventListener('click', clearBelow);
showAllButton.addEventListener('click', toggleCheckedItems);

document.getElementById('add-location-button').addEventListener('click', function() {
    document.getElementById('map-modal').style.display = "block";
});

document.getElementById('close-map-modal').addEventListener('click', function() {
    document.getElementById('map-modal').style.display = "none";
});

setInterval(autoSave, 500);

window.addEventListener('load', restoreData);