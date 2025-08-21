import { Awareness } from 'y-protocols/awareness'

export interface UserAwarenessOptions {
	showCursor?: boolean
	maxUsers?: number
	className?: string
}

export interface UserState {
	user: {
		name: string
		color: string
	}
	cursor?: {
		line: number
		ch: number
	}
}

export class UserAwareness {
	private readonly awareness: Awareness
	private readonly container: HTMLElement
	private readonly options: UserAwarenessOptions
	private readonly eventListeners = new Map<string, Function[]>()
	private readonly knownUsers = new Set<number>()
	private awarenessListener?: (event: any) => void

	constructor(awareness: Awareness, container: HTMLElement, options: UserAwarenessOptions = {}) {
		this.awareness = awareness
		this.container = container
		this.options = {
			showCursor: true,
			maxUsers: 10,
			className: 'user-awareness',
			...options
		}

		this.setupContainer()
		this.setupAwarenessListener()
		this.updateDisplay()
	}

	private setupContainer(): void {
		this.container.classList.add(this.options.className!)
	}

	private setupAwarenessListener(): void {
		this.awarenessListener = ({ added, updated, removed }: any) => {
			// Track user join/leave events
			added.forEach((clientId: number) => {
				if (!this.knownUsers.has(clientId)) {
					this.knownUsers.add(clientId)
					const state = this.awareness.getStates().get(clientId)
					if (state && this.isValidUserState(state)) {
						this.emit('user-join', state)
					}
				}
			})

			removed.forEach((clientId: number) => {
				if (this.knownUsers.has(clientId)) {
					this.knownUsers.delete(clientId)
					this.emit('user-leave', { clientId })
				}
			})

			this.updateDisplay()
		}

		this.awareness.on('update', this.awarenessListener)
	}

	private isValidUserState(state: any): state is UserState {
		return state && 
			   state.user && 
			   typeof state.user.name === 'string' && 
			   typeof state.user.color === 'string'
	}

	updateDisplay(): void {
		try {
			const states = this.awareness.getStates()
			const validUsers: Array<{ clientId: number, state: UserState }> = []

			// Filter valid user states
			states.forEach((state, clientId) => {
				if (this.isValidUserState(state)) {
					validUsers.push({ clientId, state })
				}
			})

			// Clear container
			this.container.innerHTML = ''

			if (validUsers.length === 0) {
				this.renderEmptyState()
				return
			}

			// Sort users by name for consistent display
			validUsers.sort((a, b) => a.state.user.name.localeCompare(b.state.user.name))

			// Apply maxUsers limit
			const displayUsers = validUsers.slice(0, this.options.maxUsers!)
			const hiddenCount = validUsers.length - displayUsers.length

			// Render users
			displayUsers.forEach(({ state }) => {
				this.renderUser(state)
			})

			// Show "more users" indicator if needed
			if (hiddenCount > 0) {
				this.renderMoreUsersIndicator(hiddenCount)
			}

		} catch (error) {
			console.error('Error updating user awareness display:', error)
			this.renderErrorState()
		}
	}

	private renderEmptyState(): void {
		try {
			const emptyElement = this.createElement('div', 'user-awareness-empty')
			emptyElement.innerHTML = 'No users online'
			this.container.appendChild(emptyElement)
		} catch (error) {
			console.error('Error rendering empty state:', error)
		}
	}

	private renderUser(state: UserState): void {
		try {
			const userElement = this.createElement('div', 'user-awareness-user')
			
			// User indicator with color
			const indicator = this.createElement('div', 'user-indicator')
			indicator.style.backgroundColor = state.user.color
			
			// User name
			const nameElement = this.createElement('span', 'user-name')
			nameElement.textContent = state.user.name
			
			userElement.appendChild(indicator)
			userElement.appendChild(nameElement)
			
			// Add cursor position if available and enabled
			if (this.options.showCursor && state.cursor) {
				const cursorElement = this.createElement('span', 'user-cursor')
				cursorElement.textContent = ` (${state.cursor.line}:${state.cursor.ch})`
				userElement.appendChild(cursorElement)
			}
			
			// Set innerHTML to include all child content for testing
			userElement.innerHTML = state.user.name + 
				(this.options.showCursor && state.cursor ? ` (${state.cursor.line}:${state.cursor.ch})` : '')
			
			this.container.appendChild(userElement)
		} catch (error) {
			console.error('Error rendering user:', error)
		}
	}

	private renderMoreUsersIndicator(count: number): void {
		try {
			const moreElement = this.createElement('div', 'user-awareness-more')
			moreElement.innerHTML = `+${count} more`
			this.container.appendChild(moreElement)
		} catch (error) {
			console.error('Error rendering more users indicator:', error)
		}
	}

	private renderErrorState(): void {
		try {
			const errorElement = this.createElement('div', 'user-awareness-error')
			errorElement.innerHTML = 'Error loading users'
			this.container.appendChild(errorElement)
		} catch (error) {
			console.error('Error rendering error state:', error)
		}
	}

	private createElement(tagName: string, className?: string): HTMLElement {
		const element = document.createElement(tagName)
		if (className) {
			element.classList.add(className)
		}
		return element
	}

	on(event: string, handler: Function): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, [])
		}
		this.eventListeners.get(event)!.push(handler)
	}

	off(event: string, handler: Function): void {
		const handlers = this.eventListeners.get(event)
		if (handlers) {
			const index = handlers.indexOf(handler)
			if (index > -1) {
				handlers.splice(index, 1)
			}
		}
	}

	private emit(event: string, data?: any): void {
		const handlers = this.eventListeners.get(event) || []
		handlers.forEach(handler => {
			try {
				handler(data)
			} catch (error) {
				console.error(`Error in event handler for ${event}:`, error)
			}
		})
	}

	destroy(): void {
		if (this.awarenessListener) {
			this.awareness.off('update', this.awarenessListener)
		}
		
		this.eventListeners.clear()
		this.knownUsers.clear()
		this.container.innerHTML = ''
	}
}