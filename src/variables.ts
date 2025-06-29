import type { ModuleInstance } from './main.js'

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions([
		{ variableId: 'channel_description', name: 'Channel Description' },
		{ variableId: 'error_description', name: 'Error Description' },
		{ variableId: 'has_license', name: 'Has License' },
		{ variableId: 'job_status', name: 'Job Status' },
		{ variableId: 'preview_state', name: 'Preview State' },
		{ variableId: 'status', name: 'Status' },
		{ variableId: 'timecode', name: 'Timecode' },
		{ variableId: 'job_completed_time', name: 'Job Completed Time' },
		{ variableId: 'job_created_time', name: 'Job Created Time' },
		{ variableId: 'job_current_timecode', name: 'Job Current Timecode' },
		{ variableId: 'job_dropped_frames', name: 'Job Dropped Frames' },
		{ variableId: 'job_elapsed_duration', name: 'Job Elapsed Duration' },
		{ variableId: 'job_error_description', name: 'Job Error Description' },
		{ variableId: 'job_id', name: 'Job ID' },
		{ variableId: 'job_percentage_completed', name: 'Job Percentage Completed' },
		{ variableId: 'job_processed_frames', name: 'Job Processed Frames' },
		{ variableId: 'job_repaired_frames', name: 'Job Repaired Frames' },
		{ variableId: 'job_start_timecode', name: 'Job Start Timecode' },
		{ variableId: 'job_started_time', name: 'Job Started Time' },
		{ variableId: 'job_status_code', name: 'Job Status Code' },
		{ variableId: 'job_stop_timecode', name: 'Job Stop Timecode' },
		{ variableId: 'job_timecode_breaks', name: 'Job Timecode Breaks' },
		{ variableId: 'tv_aspect_ratio', name: 'TV Aspect Ratio' },
		{ variableId: 'tv_frame_rate', name: 'TV Frame Rate' },
		{ variableId: 'tv_is_drop_frame', name: 'TV Is Drop Frame' },
	])
}
