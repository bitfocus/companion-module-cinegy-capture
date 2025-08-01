import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	dynamicVariables: string[] = []
	variableUpdateEnabled: boolean = false
	config!: ModuleConfig // Setup in init()
	jobTemplatesCache: { id: string; label: string }[] = []
	private pollTimer: NodeJS.Timeout | undefined
	currentStatus: any = null
	private jobTemplatesCacheRawIds: Set<string> = new Set()

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.dynamicVariables = []

		this.updateStatus(InstanceStatus.Connecting)

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
		this.pollTimer = setInterval(() => void this.pollStatus(), 1000)
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.variableUpdateEnabled = false

		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = undefined
		}

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

	async pollStatus(): Promise<void> {
		try {
			const status = await this.apiGet('Status')
			this.log('debug', `Polled Status: ${JSON.stringify(status)}`)

			this.currentStatus = status
			// Trigger Feedback Updates
			this.checkFeedbacks()
			this.updateAllVariables()
			await this.syncTemplateChoices()
		} catch (error) {
			this.log('error', `Polling error: ${error}`)
			this.updateStatus(InstanceStatus.Disconnected)
		}
	}

	async apiGet(apimethod: string): Promise<any> {
		this.log('debug', `Send GET request to ${apimethod}`)
		const url = `http://${this.config.host}:800${this.config.engine}/REST/${apimethod}`
		this.log('debug', `API Url: ${url}`)
		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
			})

			if (!response.ok) {
				this.log('error', `GET ${apimethod} failed with status ${response.status} ${response.statusText}`)
				this.updateStatus(InstanceStatus.Disconnected)
				return null
			} else {
				this.updateStatus(InstanceStatus.Ok)
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
			this.updateStatus(InstanceStatus.Disconnected)
			return null
		}
	}

	async apiPost(apimethod: string, body: string): Promise<any> {
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
	async apiPostNoBody(apimethod: string): Promise<any> {
		this.log('debug', `Send POST request to ${apimethod}`)
		const url = `http://${this.config.host}:800${this.config.engine}/REST/${apimethod}`
		this.log('debug', `API Url: ${url}`)

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
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

	updateAllVariables(): void {
		if (!this.currentStatus) return

		const s = this.currentStatus
		const js = s.JobShortState ?? {}
		const tv = s.TVFormatInfo ?? {}
		const ar = tv.AspectRatio ?? {}

		this.setVariableValues({
			channel_description: s.ChannelDescription ?? '',
			error_description: s.ErrorDescription ?? '',
			has_license: s.HasLicense,
			job_status: s.JobStatus ?? '',
			preview_state: s.PreviewState ?? '',
			status: s.Status ?? '',
			timecode: s.Timecode ?? '',
			job_completed_time: this.parseMicrosoftDate(js.CompletedTime),
			job_created_time: this.parseMicrosoftDate(js.CreatedTime),
			job_current_timecode: js.CurrentTimecode ?? '',
			job_dropped_frames: js.DroppedFramesCount ?? 0,
			job_elapsed_duration: js.ElapsedDuration ?? '',
			job_error_description: js.ErrorDescription ?? '',
			job_id: js.Id ?? '',
			job_percentage_completed: js.PercentageCompleted ?? 0,
			job_processed_frames: js.ProcessedFramesCount ?? 0,
			job_repaired_frames: js.RepairedFramesCount ?? 0,
			job_start_timecode: js.StartTimecode ?? '',
			job_started_time: this.parseMicrosoftDate(js.StartedTime),
			job_status_code: js.Status ?? '',
			job_stop_timecode: js.StopTimecode ?? '',
			job_timecode_breaks: js.TimecodeBreaksCount ?? 0,
			tv_aspect_ratio: ar.width && ar.height ? `${ar.width}:${ar.height}` : '',
			tv_frame_rate: tv.FrameRate ?? 0,
			tv_is_drop_frame: tv.IsDropFrame,
		})
	}

	parseMicrosoftDate(msDate: string | null | undefined): string {
		if (!msDate) return ''

		// Format: /Date(1751194230000)/
		const match = /\/Date\((\d+)\)\//.exec(msDate)
		if (!match) return ''

		const timestamp = parseInt(match[1], 10)
		if (isNaN(timestamp)) return ''

		const date = new Date(timestamp)

		return date.toLocaleString()
	}

	async syncTemplateChoices(): Promise<void> {
		try {
			const data = await this.apiGet('JobTemplates')

			if (!data || !Array.isArray(data)) {
				this.log('error', 'JobTemplates API returned unexpected data')
				return
			}
			const newIds = new Set(data.map((item) => item.Id))
			const idsEqual =
				newIds.size === this.jobTemplatesCacheRawIds.size &&
				[...newIds].every((id) => this.jobTemplatesCacheRawIds.has(id))
			if (!idsEqual) {
				this.jobTemplatesCache = data.map((item) => ({ id: item.Id, label: item.Name }))
				this.jobTemplatesCacheRawIds = newIds
				this.log('info', `Updated JobTemplates Cache with ${data.length} entries`)
				this.updateActions()
			} else {
				this.log('debug', 'JobTemplates unchanged, no update needed.')
			}
		} catch (error) {
			this.log('error', `Failed to sync JobTemplates: ${error}`)
		}
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
