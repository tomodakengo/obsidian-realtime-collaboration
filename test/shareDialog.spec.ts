import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ShareDialog } from '../src/ui/ShareDialog'

describe('ShareDialog', () => {
	let shareDialog: ShareDialog

	beforeEach(() => {
		shareDialog = new ShareDialog()
	})

	afterEach(() => {
		shareDialog.destroy()
	})

	it('creates a share dialog instance', () => {
		expect(shareDialog).toBeInstanceOf(ShareDialog)
	})

	it('can generate a room ID', () => {
		const roomId = shareDialog.generateRoomId()
		expect(roomId).toBeDefined()
		expect(typeof roomId).toBe('string')
		expect(roomId.length).toBeGreaterThan(0)
	})

	it('generates unique room IDs', () => {
		const roomId1 = shareDialog.generateRoomId()
		const roomId2 = shareDialog.generateRoomId()
		expect(roomId1).not.toBe(roomId2)
	})

	it('can generate a shareable link', () => {
		const roomId = shareDialog.generateRoomId()
		const link = shareDialog.generateShareableLink(roomId)
		
		expect(link).toBeDefined()
		expect(typeof link).toBe('string')
		expect(link).toContain(roomId)
	})

	it('can parse room ID from a shareable link', () => {
		const roomId = shareDialog.generateRoomId()
		const link = shareDialog.generateShareableLink(roomId)
		const parsedRoomId = shareDialog.parseRoomIdFromLink(link)
		
		expect(parsedRoomId).toBe(roomId)
	})

	it('returns null for invalid shareable links', () => {
		const invalidLink = 'https://invalid-link.com'
		const parsedRoomId = shareDialog.parseRoomIdFromLink(invalidLink)
		
		expect(parsedRoomId).toBeNull()
	})

	it('can set room password', () => {
		const roomId = shareDialog.generateRoomId()
		const password = 'test-password'
		
		shareDialog.setRoomPassword(roomId, password)
		const hasPassword = shareDialog.hasRoomPassword(roomId)
		
		expect(hasPassword).toBe(true)
	})

	it('can check if room has password', () => {
		const roomId = shareDialog.generateRoomId()
		
		// Initially no password
		expect(shareDialog.hasRoomPassword(roomId)).toBe(false)
		
		// Set password
		shareDialog.setRoomPassword(roomId, 'test-password')
		expect(shareDialog.hasRoomPassword(roomId)).toBe(true)
	})

	it('can validate room password', () => {
		const roomId = shareDialog.generateRoomId()
		const password = 'test-password'
		
		shareDialog.setRoomPassword(roomId, password)
		
		expect(shareDialog.validateRoomPassword(roomId, password)).toBe(true)
		expect(shareDialog.validateRoomPassword(roomId, 'wrong-password')).toBe(false)
	})

	it('can get room settings', () => {
		const roomId = shareDialog.generateRoomId()
		const settings = shareDialog.getRoomSettings(roomId)
		
		expect(settings).toBeDefined()
		expect(settings.id).toBe(roomId)
		expect(settings.createdAt).toBeDefined()
		expect(settings.hasPassword).toBe(false)
	})

	it('can update room settings', () => {
		const roomId = shareDialog.generateRoomId()
		const newSettings = {
			name: 'Test Room',
			description: 'A test room for collaboration',
			maxParticipants: 10
		}
		
		shareDialog.updateRoomSettings(roomId, newSettings)
		const settings = shareDialog.getRoomSettings(roomId)
		
		expect(settings.name).toBe(newSettings.name)
		expect(settings.description).toBe(newSettings.description)
		expect(settings.maxParticipants).toBe(newSettings.maxParticipants)
	})
})