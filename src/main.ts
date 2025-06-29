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
	jobTemplatesCache: { id: string; label: string }[] = []

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.dynamicVariables = []

	this.jobTemplatesCache = await this.getTemplateChoices()
		this.log('debug', `Job Templates: ${this.jobTemplatesCache}`)

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

async apiGet(apimethod: string): Promise<any> {
    this.log('debug', `Send GET request to ${apimethod}`)
    const url = `http://${this.config.host}:800${this.config.engine}/REST/${apimethod}`
    this.log('debug', `API Url: ${url}`)
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })

        // Status prüfen, um Fehler sauber abzufangen
        if (!response.ok) {
            this.log('error', `GET ${apimethod} failed with status ${response.status} ${response.statusText}`)
            return null
        }

        try {
            const data = await response.json()
            this.log('debug', `Response JSON: ${JSON.stringify(data)}`)
            return data
        } catch (jsonError) {
            this.log('warn', `Response is not valid JSON, attempting to read as text. Error: ${jsonError}`)
            const text = await response.text()
            this.log('debug', `Response Text: ${text}`)
            return text
        }

    } catch (error) {
        this.log('error', `GET ${apimethod} failed: ${error}`)
        return null
    }
}

	async apiPost(apimethod: string, body: any): Promise<any> {
	this.log('debug', `Send POST request to ${apimethod}`)
	const url = `http://${this.config.host}:800${this.config.engine}/REST/${apimethod}`
	this.log('debug', `API Url: ${url}`)
	this.log('debug', `Request-Body: ${JSON.stringify(body)}`)

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		})

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
		this.log('error', `POST ${apimethod} failed: ${error}`)
		return null
	}
}
async apiPostNoBody(apimethod: string): Promise<any> {
	this.log('debug', `Send POST request to ${apimethod}`)
	const url = `http://${this.config.host}:800${this.config.engine}/REST/${apimethod}`
	this.log('debug', `API Url: ${url}`)

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			}
			// Kein "body"-Feld
		})

		const text = await response.text()
		this.log('debug', `Response-Text: ${text}`)

		try {
			return JSON.parse(text)
		} catch {
			return text
		}
	} catch (error) {
		this.log('error', `POST ${apimethod} failed: ${error}`)
		return null
	}
}

async getTemplateChoices(): Promise<{ id: string; label: string }[]> {
    try {
        const data = await this.apiGet('JobTemplates')

        if (!data || !Array.isArray(data)) {
            this.log('error', 'JobTemplates API returned unexpected data')
            return []
        }

        return data.map((item) => ({
            id: item.Id,
            label: item.Name,
        }))
    } catch (error) {
        this.log('error', `Failed to fetch JobTemplates: ${error}`)
        return []
    }
}


}

runEntrypoint(ModuleInstance, UpgradeScripts)
