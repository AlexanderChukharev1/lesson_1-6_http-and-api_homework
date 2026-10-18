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
const formTitle = document.querySelector("#form-title")
const cancelButton = document.querySelector('[data-action="cancel-edit"]')

let editingBook = null
let isBusy = false

document.querySelector('[data-ui="endpoint"]').textContent = API_URL

function setBusy(value) {
  isBusy = value
  submitButton.disabled = value
  cancelButton.disabled = value
  reloadButton.disabled = value

  for (const button of collection.querySelectorAll("button")) {
    button.disabled = value
  }
}

function setListState(state, title, message) {
  status.className = `status status--${state}`
  statusTitle.textContent = title
  statusText.textContent = message
  collection.hidden = state !== "success"
}

function cancelEditing() {
  editingBook = null
  bookForm.reset()
  formTitle.textContent = "Добавить книгу"
  submitButton.textContent = "Отправить в API"
  cancelButton.hidden = true
  submitStatus.textContent = ""
}

function editBook(book) {
  if (isBusy) return

  editingBook = book
  bookForm.elements.namedItem("title").value = book.title
  bookForm.elements.namedItem("author").value = book.author
  bookForm.elements.namedItem("genre").value = book.genre
  bookForm.elements.namedItem("year").value = book.year

  formTitle.textContent = "Редактировать книгу"
  submitButton.textContent = "Сохранить изменения"
  cancelButton.hidden = false
  submitStatus.textContent = ""
  bookForm.scrollIntoView({ behavior: "smooth", block: "start" })
}

async function deleteBook(book) {
  if (isBusy || !window.confirm(`Удалить книгу «${book.title}»?`)) return

  setBusy(true)

  try {
    const response = await fetch(`${API_URL}/${encodeURIComponent(book.id)}`, {
      method: "DELETE"
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    if (editingBook?.id === book.id) {
      cancelEditing()
    }

    await loadBooks()
  } catch (error) {
    console.error("Не удалось удалить книгу", error)
    status.className = "status status--error"
    statusTitle.textContent = "Ошибка удаления"
    statusText.textContent = "Не удалось удалить книгу. Попробуйте снова."
    collection.hidden = false
  } finally {
    setBusy(false)
  }
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

  const editButton = document.createElement("button")
  editButton.type = "button"
  editButton.className = "button button--secondary"
  editButton.textContent = "Редактировать"
  editButton.disabled = isBusy
  editButton.addEventListener("click", () => editBook(book))

  const deleteButton = document.createElement("button")
  deleteButton.type = "button"
  deleteButton.className = "button button--secondary"
  deleteButton.textContent = "Удалить"
  deleteButton.disabled = isBusy
  deleteButton.addEventListener("click", () => deleteBook(book))

  meta.append(author, genre, year, editButton, deleteButton)
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
    reloadButton.disabled = isBusy
  }
}

bookForm.addEventListener("submit", async (event) => {
  event.preventDefault()
  if (isBusy) return

  const formData = new FormData(bookForm)
  const book = {
    title: formData.get("title").trim(),
    author: formData.get("author").trim(),
    genre: formData.get("genre"),
    year: Number(formData.get("year"))
  }

  const changes = {}

  if (editingBook) {
    for (const key of Object.keys(book)) {
      if (book[key] !== editingBook[key]) {
        changes[key] = book[key]
      }
    }

    if (Object.keys(changes).length === 0) {
      submitStatus.textContent = "Изменений нет."
      return
    }
  }

  setBusy(true)
  submitStatus.textContent = editingBook ? "Сохраняем изменения…" : "Отправляем книгу…"

  try {
    const wasEditing = Boolean(editingBook)
    const url = wasEditing ? `${API_URL}/${encodeURIComponent(editingBook.id)}` : API_URL
    const response = await fetch(url, {
      method: wasEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(wasEditing ? changes : book)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const savedBook = await response.json()
    console.log(savedBook)

    cancelEditing()
    submitStatus.textContent = wasEditing ? "Книга обновлена." : "Книга успешно добавлена."
    await loadBooks()
  } catch (error) {
    console.error("Не удалось сохранить книгу", error)
    submitStatus.textContent = "Не удалось сохранить книгу. Проверьте API и попробуйте снова."
  } finally {
    setBusy(false)
  }
})

cancelButton.addEventListener("click", cancelEditing)
reloadButton.addEventListener("click", loadBooks)
loadBooks()
