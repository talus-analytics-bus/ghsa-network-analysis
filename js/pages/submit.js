(() => {
	App.initSubmit = () => {
		// connect link to glossary page
		$('.glossary-button').click(() => hasher.setHash('glossary'));

		// clicking "upload" button opens file selection window
		$('.btn-report-upload').click(() => {
			$('.input-report-upload').trigger('click');
		});

		// update file name text when user selects a file to be uploaded
		$('.input-report-upload').on('change', function updateText() {
			let fileName = 'No file selected';
			if (this.files.length) fileName = this.files[0].name;
			$('.file-name-text').text(fileName);
		});

		// upload completed project report
		$('.submit-button').click(() => {
			// check that contact fields are filled out
			const firstName = $('.first-name-input').val();
			const lastName = $('.last-name-input').val();
			const org = $('.org-input').val();
			const email = $('.email-input').val();
			/*if (!firstName) {
				noty({ text: 'Please enter a first name before proceeding.' });
				return;
			}
			if (!lastName) {
				noty({ text: 'Please enter a last name before proceeding.' });
				return;
			}
			if (!org) {
				noty({ text: 'Please enter an organization before proceeding.' });
				return;
			}
			if (!email) {
				noty({ text: 'Please enter an email address before proceeding.' });
				return;
			}*/

			const input = d3.select('.input-report-upload').node();
			if ('files' in input) {
				if (!input.files.length) return;  // check that file was uploaded
				const file = input.files[0];

				// check that file is in xls or xlsx format
				const fileNameArr = file.name.split('.');
				const fileType = fileNameArr[fileNameArr.length - 1];
				if (fileType !== 'xlsx' && fileType !== 'xls') {
					noty({
						timeout: 5000,
						text: '<b>Please select a file with a file type ' +
							'extension of <i>.xls</i> or <i>.xlsx</i>',
					});
					return;
				}

				submitProjectReport(file);
			}
		});
	};

	// parses project report and saves data
	function submitProjectReport(file) {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', `/upload-s3?file-name=${file.name}&file-type=${file.type}`);
		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					const response = JSON.parse(xhr.responseText);
					uploadFile(file, response.signedRequest, response.url);
				} else {
					noty({ type: 'error', text: 'Could not get signed URL.' });
				}
			}
		};
		xhr.send();
	}

	function uploadFile(file, signedRequest, url) {
		console.log(signedRequest);
		const xhr = new XMLHttpRequest();
		xhr.open('PUT', signedRequest);
		xhr.onreadystatechange = () => {
			console.log(xhr);
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					console.log(xhr);
					// TODO
					noty({ type: 'success', text: 'Report has been submitted!' });
				} else {
					console.log(xhr.response);
					noty({ text: 'There was an issue submitting your report. Please notify the administrators of the tool.' });
				}
			}
		};
		xhr.send(file);
	}
})();
