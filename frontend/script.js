// Стартовая точка домашней работы.
// Спроектируйте модель ресурса, запросы и состояния самостоятельно.

console.log('API storefront starter is ready');

const API_URL = "http://localhost:3000/books"

const collection = document.querySelector('[data-ui="collection"]')
const status = document.querySelector('[data-ui="status"]')
const statusTitle = status.querySelector(".status__title")
const statusText = status.querySelector(".status__text")
const reloadButton = document.querySelector('[data-action="reload"]')
const bookForm = document.querySelector('[data-form="entry"]')
const submitButton = document.querySelector('[data-action="submit"]')
const submitStatus = document.querySelector('[data-ui="submit-status"]')

document.querySelector('[data-ui="endpoint"]').textContent = API_URL

function setListState(state, title, message) {
  status.className = `status status--${state}`
  statusTitle.textContent = title
  statusText.textContent = message
  collection.hidden = state !== "success"
}

function createBookCard(book) {
  const card = document.createElement("article")
  card.className = "card"

  const title = document.createElement("h3")
  title.className = "card__title"
  title.textContent = book.title

  const meta = document.createElement("div")
  meta.className = "card__meta"

  const author = document.createElement("span")
  author.textContent = `Автор: ${book.author}`

  const genre = document.createElement("span")
  genre.textContent = `Жанр: ${book.genre}`

  const year = document.createElement("span")
  year.textContent = `Год издания: ${book.year}`

  meta.append(author, genre, year)
  card.append(title, meta)

  return card
}

function renderBooks(books) {
  collection.replaceChildren()

  if (books.length === 0) {
    setListState("empty", "Книг пока нет", "Список книг пуст.")
    return
  }

  for (const book of books) {
    collection.append(createBookCard(book))
  }

  setListState("success", "Книги загружены", `Найдено книг: ${books.length}`)
}

async function loadBooks() {
  setListState("loading", "Загрузка", "Получаем книги с сервера…")
  reloadButton.disabled = true

  try {
    const response = await fetch(API_URL)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const books = await response.json()

    console.log(response)
    console.log(books)

    renderBooks(books)
  } catch (error) {
    console.error("Не удалось загрузить книги", error)
    setListState("error", "Ошибка загрузки", "Не удалось получить книги. Проверьте API и нажмите «Обновить».")
  } finally {
    reloadButton.disabled = false
  }
}

bookForm.addEventListener("submit", async (event) => {
  event.preventDefault()

  submitButton.disabled = true
  submitStatus.textContent = "Отправляем книгу…"

  const formData = new FormData(bookForm)
  const book = {
    title: formData.get("title").trim(),
    author: formData.get("author").trim(),
    genre: formData.get("genre"),
    year: Number(formData.get("year"))
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(book)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const createdBook = await response.json()
    console.log(createdBook)

    bookForm.reset()
    submitStatus.textContent = "Книга успешно добавлена."
    await loadBooks()
  } catch (error) {
    console.error("Не удалось добавить книгу", error)
    submitStatus.textContent = "Не удалось добавить книгу. Проверьте API и попробуйте снова."
  } finally {
    submitButton.disabled = false
  }
})

reloadButton.addEventListener("click", loadBooks)
loadBooks()
