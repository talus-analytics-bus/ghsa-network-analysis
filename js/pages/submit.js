(() => {
	App.initSubmit = () => {
		// initialize datepickers
		$('.start-date-input, .end-date-input').datepicker({
			autoclose: true,
			assumeNearbyYear: true,
			clearBtn: true,
			container: '.submit-page-container',
			immediateUpdates: true,
		});

		// populate dropdowns
		Util.populateSelect('.country-select', App.countries, {
			valKey: 'ISO2',
			nameKey: 'NAME',
		});
		Util.populateSelect('.cc-select', App.capacities, {
			valKey: 'id',
			nameKey: 'name',
		});
		$('.cc-select').multiselect({
			maxHeight: 260,
			numberDisplayed: 1,
		});

		/* ------------------ Uploading Project Report File --------------- */
		// clicking "Upload Completed Project Report" triggers file selection
		$('.btn-report-upload').on('click', () => {
			$('.input-report-upload').trigger('click');
		});

		// upload completed project report
		$('.input-report-upload').on('change', function() {
			if ('files' in this) {
				if (!this.files.length) return;
				const file = this.files[0];
				const fileNameArr = file.name.split('.');
				const fileType = fileNameArr[fileNameArr.length - 1];
				if (fileType !== 'xlsx' && fileType !== 'xls') {
					noty({
						timeout: 5000,
						text: '<b>Please select a file with a file type extension of <i>.xls</i> or <i>.xlsx</i>',
					});
					return;
				}

				// read and ingest
				const reader = new FileReader();
				reader.onload = (e) => {
					NProgress.start();
					const success = App.submitProjectReport(e.target.result);
					if (success) {
						noty({
							timeout: 4000,
							type: 'success',
							text: '<b>Upload Successful!</b><br>Project report has been submitted.',
						});
					} else {
						noty({
							timeout: 5000,
							text: '<b>Error!</b><br>There was an error uploading the project report. Please check the file format.',
						})
					}
					NProgress.done();
				}
				reader.readAsBinaryString(file);
			}
		});
	};

	/*
	*
	*	App.submitProjectReport
	*	Callback function triggered when user successfully uploads project report.
	*	Parses the project report and forwards it to the appropriate reviewer
	*	so it can be incorporated into the dashboard data.
	*
	*	TODO
	*
	*/

	App.submitProjectReport = (projectReportXls) => {
		// TODO
		console.log(projectReportXls);
		return true;
	};
})();
