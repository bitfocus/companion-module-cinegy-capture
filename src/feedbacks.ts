import { combineRgb } from '@companion-module/base'
import type { ModuleInstance } from './main.js'

// @ts-expect-error Error is expected due to strange import behaviour of the image-rs wrapper of @julusian
import { ImageTransformer } from '@julusian/image-rs'

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
			callback: () => self.currentStatus?.HasLicense === true,
		},

		job_running_feedback: {
			type: 'boolean',
			name: 'Job Running',
			description: 'Shows if a job is currently running (JobStatus = "Started")',
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(255, 0, 0),
			},
			options: [],
			callback: () => self.currentStatus?.JobStatus === 'Started',
		},

		preview_active_feedback: {
			type: 'boolean',
			name: 'Preview Active',
			description: 'Shows if PreviewState is "Started"',
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 255),
			},
			options: [],
			callback: () => self.currentStatus?.PreviewState === 'Started',
		},
		preview_image: {
			type: 'advanced',
			name: 'Live Preview Image',
			description: 'Displays the Cinegy Capture preview image',
			options: [],
			callback: async (feedback) => {
				const previewUrl = `http://${self.config.host}:800${self.config.engine}/REST/Preview`
				try {
					const response = await fetch(previewUrl)
					if (!response.ok) {
						throw new Error(`HTTP ${response.status}: ${response.statusText}`)
					}
					const buffer = Buffer.from(await response.arrayBuffer())

					const png64 = await ImageTransformer.fromEncodedImage(buffer)
						.scale(feedback.image?.width ?? 72, feedback.image?.height ?? 72, 'Fit')
						.toDataUrl('png')
					self.log('debug', png64)
					return { png64 }
				} catch (err) {
					self.log('error', `Preview image error: ${err}`)
					return {}
				}
			},
		},
	})
}
