const API = 'https://pokeapi.co/api/v2/pokemon';
const listEl = document.getElementById('pokemon-list');
const detailEl = document.getElementById('pokemon-detail');
const favGridEl = document.getElementById('favorites-grid');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const btnLoadInitial = document.getElementById('btn-load-initial');

const FAVORITES_KEY = 'pokedex:favorites:v1';

function saveFavorites(favs) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

function loadFavorites() {
  return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
}

function toggleFavorite(id) {
  const favs = loadFavorites();
  const index = favs.indexOf(id);
  if (index >= 0) {
    favs.splice(index, 1);
  } else {
    favs.push(id);
  }
  saveFavorites(favs);
  renderFavorites();
}

async function fetchPokemon(query) {
  const res = await fetch(`${API}/${query}`);
  if (!res.ok) throw new Error('Pokémon no encontrado');
  return res.json();
}

async function fetchFirstN(n = 20) {
  const res = await fetch(`${API}?limit=${n}`);
  const data = await res.json();
  return Promise.all(data.results.map(p => fetch(p.url).then(r => r.json())));
}

function renderPokemonCard(pokemon) {
  const card = document.getElementById('tpl-card').content.cloneNode(true);
  card.querySelector('.pokemon-card__image').src = pokemon.sprites.other['official-artwork'].front_default;
  card.querySelector('.pokemon-card__name').textContent = pokemon.name;
  card.querySelector('.pokemon-card__id').textContent = `#${pokemon.id}`;
  card.querySelector('.pokemon-card__fav').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(pokemon.id);
  });
  card.querySelector('.pokemon-card').addEventListener('click', () => renderDetail(pokemon));
  return card;
}

function renderList(pokemonArray) {
  listEl.innerHTML = '';
  pokemonArray.forEach(p => listEl.appendChild(renderPokemonCard(p)));
}

function renderDetail(pokemon) {
  detailEl.innerHTML = `
    <h2>${pokemon.name} (#${pokemon.id})</h2>
    <img src="${pokemon.sprites.other['official-artwork'].front_default}" alt="${pokemon.name}">
    <p>Altura: ${pokemon.height / 10} m</p>
    <p>Peso: ${pokemon.weight / 10} kg</p>
    <h3>Stats</h3>
    <ul>
      ${pokemon.stats.map(s => `<li>${s.stat.name}: ${s.base_stat}</li>`).join('')}
    </ul>
  `;
}

function renderFavorites() {
  const favs = loadFavorites();
  favGridEl.innerHTML = '';
  favs.forEach(async id => {
    const pokemon = await fetchPokemon(id);
    favGridEl.appendChild(renderPokemonCard(pokemon));
  });
}

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;
  try {
    const pokemon = await fetchPokemon(query);
    renderList([pokemon]);
    renderDetail(pokemon);
  } catch {
    detailEl.innerHTML = '<p>Pokémon no encontrado</p>';
  }
});

btnLoadInitial.addEventListener('click', async () => {
  const pokemons = await fetchFirstN();
  renderList(pokemons);
  renderDetail(pokemons[0]);
});

renderFavorites();

