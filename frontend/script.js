
// Стартовая точка домашней работы.
// Спроектируйте модель ресурса, запросы и состояния самостоятельно.

console.log('API storefront starter is ready');

const API_URL = "http://localhost:3000/books"
const REQUEST_TIMEOUT = 5000

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

async function apiRequest(url, options = {}, readJson = true) {
  const controller = new AbortController()
  let timedOut = false
  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`)
      error.status = response.status
      throw error
    }

    const data = readJson ? await response.json() : null
    return { response, data }
  } catch (error) {
    if (timedOut) {
      const timeoutError = new Error("Превышено время ожидания")
      timeoutError.name = "TimeoutError"
      throw timeoutError
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

function getErrorMessage(error) {
  if (error.name === "TimeoutError") return "Сервер не ответил за 5 секунд. Попробуйте снова."
  if (error.status === 404) return "Ошибка 404: ресурс не найден."
  if (error.status) return `Ошибка HTTP ${error.status}. Попробуйте снова.`
  return "Нет соединения с API. Проверьте, что сервер запущен."
}

function normalizeTitle(title) {
  return title.trim().replace(/\s+/g, " ").toLowerCase()
}

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
    await apiRequest(`${API_URL}/${encodeURIComponent(book.id)}`, {
      method: "DELETE"
    }, false)

    if (editingBook?.id === book.id) {
      cancelEditing()
    }

    await loadBooks()
  } catch (error) {
    console.error("Не удалось удалить книгу", error)
    status.className = "status status--error"
    statusTitle.textContent = error.name === "TimeoutError" ? "Тайм-аут" : "Ошибка удаления"
    statusText.textContent = getErrorMessage(error)
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
    const { response, data: books } = await apiRequest(API_URL)

    console.log(response)
    console.log(books)

    renderBooks(books)
  } catch (error) {
    console.error("Не удалось загрузить книги", error)
    const title = error.name === "TimeoutError" ? "Тайм-аут" : error.status === 404 ? "Ошибка 404" : "Ошибка загрузки"
    setListState("error", title, getErrorMessage(error))
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

  if (book.title.length < 2 || book.author.length < 2) {
    submitStatus.textContent = "Название и автор должны содержать минимум 2 символа."
    return
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
    const { data: books } = await apiRequest(API_URL)

    const duplicate = books.some(existing =>
      normalizeTitle(existing.title) === normalizeTitle(book.title) &&
      normalizeTitle(existing.author) === normalizeTitle(book.author) &&
      normalizeTitle(existing.genre) === normalizeTitle(book.genre) &&
      Number(existing.year) === book.year &&
      (!wasEditing || String(existing.id) !== String(editingBook.id))
    )

    if (duplicate) {
      submitStatus.textContent = "Книга с такими данными уже существует."
      return
    }

    const url = wasEditing ? `${API_URL}/${encodeURIComponent(editingBook.id)}` : API_URL
    const { data: savedBook } = await apiRequest(url, {
      method: wasEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(wasEditing ? changes : book)
    })

    console.log(savedBook)

    cancelEditing()
    submitStatus.textContent = wasEditing ? "Книга обновлена." : "Книга успешно добавлена."
    await loadBooks()
  } catch (error) {
    console.error("Не удалось сохранить книгу", error)
    submitStatus.textContent = getErrorMessage(error)
  } finally {
    setBusy(false)
  }
})

cancelButton.addEventListener("click", cancelEditing)
reloadButton.addEventListener("click", loadBooks)
loadBooks()
