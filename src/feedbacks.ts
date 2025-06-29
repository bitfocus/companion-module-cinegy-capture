import { combineRgb } from '@companion-module/base'
import type { ModuleInstance } from './main.js'

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		has_license_feedback: {
			type: 'boolean',
			name: 'Has License',
			description: 'Shows if the system has a valid license',
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 255, 0),
			},
			options: [],
			callback: () => {
				return self.currentStatus?.HasLicense === true
			},
		},

		job_running_feedback: {
			type: 'boolean',
			name: 'Job Running',
			description: 'Shows if a job is currently running (JobStatus = "Started")',
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(255, 0, 0), // Red Tally
			},
			options: [],
			callback: () => {
				return self.currentStatus?.JobStatus === 'Started'
			},
		},

		preview_active_feedback: {
			type: 'boolean',
			name: 'Preview Active',
			description: 'Shows if PreviewState is "Started"',
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 255), // Blue Tally
			},
			options: [],
			callback: () => {
				return self.currentStatus?.PreviewState === 'Started'
			},
		},
	})
}
