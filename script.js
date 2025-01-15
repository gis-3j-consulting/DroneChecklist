const selectedWeather = [];
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
            if (selectedWeather.includes(weatherValue)) {
                const index = selectedWeather.indexOf(weatherValue);
                selectedWeather.splice(index, 1);
                weatherIcon.classList.remove('active');
            } else {
                selectedWeather.push(weatherValue);
                weatherIcon.classList.add('active');
            }
            console.log('Selected weather conditions:', selectedWeather);
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

        document.getElementById('show-all-button').addEventListener('click', function() {
            document.querySelectorAll('.checklist-item').forEach((item) => {
                item.classList.remove('hidden');
                item.classList.remove('highlight');
            });
        });

        document.getElementById('clear-all-button').addEventListener('click', function() {
            document.querySelectorAll('.item-checkbox').checked = false;
        });

        document.getElementById('add-location-button').addEventListener('click', function() {
            document.getElementById('map-modal').style.display = "block";
        });

        