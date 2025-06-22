import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'

import fetch from 'node-fetch'

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	dynamicVariables: string[] = []
	variableUpdateEnabled: boolean = false
	config!: ModuleConfig // Setup in init()

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.dynamicVariables = []

		this.updateStatus(InstanceStatus.Ok)

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.variableUpdateEnabled = false
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	async apiGet( apimethod: string): Promise<any> {
		this.log('debug', `Send GET request to ${apimethod}`)
		const url = `http://${this.config.host}:800${this.config.engine}/REST/${apimethod}`
		this.log('debug', `API Url: ${url}`)
		try {
			const response = await fetch(url)
			const text = await response.text()
			this.log('debug', `Response-Text: ${text}`)

			// Versuche JSON zu parsen
			try {
				return JSON.parse(text)
			} catch {
				// Kein valides JSON → gib Text zurück
				return text
			}
		} catch (error) {
			this.log('error', `GET ${apimethod} failed: ${error}`)
			return null
		}
	}

}

runEntrypoint(ModuleInstance, UpgradeScripts)
