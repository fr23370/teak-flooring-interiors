const projectForm = document.getElementById('projectForm');
const projectList = document.getElementById('adminProjectList');
const projectMessage = document.getElementById('projectMessage');
const projectCount = document.getElementById('projectCount');
const imageInput = projectForm.elements.image;
const imagePreview = document.getElementById('imagePreview');
const imagePreviewPhoto = document.getElementById('imagePreviewPhoto');
const imagePreviewLabel = document.getElementById('imagePreviewLabel');
const publishPanel = document.getElementById('publishPanel');
const stagedImagesElement = document.getElementById('stagedImages');
const publishMessage = document.getElementById('publishMessage');

const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif']
]);

let projects = [];
let editingId = null;
let previewUrl = null;
let hasGalleryChanges = false;
const stagedImages = new Map();

async function loadProjects() {
  const response = await fetch('data/projects.json');
  if (!response.ok) throw new Error('The project gallery data could not be loaded.');
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('The project gallery data is not a valid project list.');
  projects = data;
  renderProjects();
}

function showMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle('is-error', isError);
}

function updateProjectCount() {
  const inspirationCount = projects.filter((project) => project.placeholder).length;
  const count = `${projects.length} projects`;
  projectCount.textContent = inspirationCount
    ? `${count}, ${inspirationCount} inspiration samples`
    : count;
}

function makeProjectCard(project) {
  const card = document.createElement('article');
  card.className = 'admin-project-card';

  const image = document.createElement('img');
  const stagedImage = stagedImages.get(project.id);
  image.src = stagedImage ? stagedImage.previewUrl : project.image;
  image.alt = project.alt || project.title;
  image.loading = 'lazy';

  const content = document.createElement('div');
  content.className = 'admin-project-copy';
  const category = document.createElement('p');
  category.className = 'eyebrow';
  category.textContent = project.category;
  const title = document.createElement('h3');
  title.textContent = project.title;
  const description = document.createElement('p');
  description.textContent = project.description || 'No description added.';
  const actions = document.createElement('div');
  actions.className = 'admin-project-actions';

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'text-link';
  editButton.textContent = 'Edit';
  editButton.addEventListener('click', () => editProject(project));

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'text-link admin-delete-button';
  deleteButton.textContent = 'Remove';
  deleteButton.addEventListener('click', () => deleteProject(project));

  actions.append(editButton, deleteButton);
  content.append(category, title, description, actions);
  card.append(image, content);
  return card;
}

function makeDownloadButton(label, filename, content, mimeType) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'text-link staged-download';
  button.textContent = label;
  button.addEventListener('click', () => downloadFile(filename, content, mimeType));
  return button;
}

function downloadFile(filename, content, mimeType) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderPublishPanel() {
  stagedImagesElement.replaceChildren();

  stagedImages.forEach((image) => {
    const row = document.createElement('div');
    row.className = 'staged-image-row';
    const path = document.createElement('code');
    path.textContent = image.path;
    const downloadButton = makeDownloadButton(
      `Download ${image.filename}`,
      image.filename,
      image.file,
      image.file.type
    );
    row.append(path, downloadButton);
    stagedImagesElement.append(row);
  });

  publishPanel.hidden = !hasGalleryChanges;
}

function renderProjects() {
  projectList.replaceChildren();
  updateProjectCount();

  if (projects.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'admin-empty';
    emptyMessage.textContent = 'No projects yet. Add your first home or office project above.';
    projectList.append(emptyMessage);
    renderPublishPanel();
    return;
  }

  projects.forEach((project) => projectList.append(makeProjectCard(project)));
  renderPublishPanel();
}

function clearImagePreview() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  imagePreviewPhoto.removeAttribute('src');
  imagePreview.hidden = true;
}

function showImagePreview(url, label, shouldRevoke = false) {
  clearImagePreview();
  previewUrl = shouldRevoke ? url : null;
  imagePreviewPhoto.src = url;
  imagePreviewLabel.textContent = label;
  imagePreview.hidden = false;
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'interior-project';
}

function prepareImage(file, title) {
  const extension = allowedTypes.get(file.type);
  if (!extension) throw new Error('Use a JPEG, PNG, WebP, or GIF image.');
  if (file.size === 0 || file.size > 10 * 1024 * 1024) {
    throw new Error('Choose an image between 1 byte and 10 MB.');
  }

  const filename = `${slugify(title)}-${Date.now()}.${extension}`;
  const namedFile = new File([file], filename, { type: file.type });
  const previewObjectUrl = URL.createObjectURL(namedFile);
  return {
    filename,
    file: namedFile,
    path: `images/projects/${filename}`,
    previewUrl: previewObjectUrl
  };
}

function editProject(project) {
  editingId = project.id;
  projectForm.elements.title.value = project.title;
  projectForm.elements.category.value = project.category;
  projectForm.elements.description.value = project.description || '';
  imageInput.required = false;
  document.getElementById('formHeading').textContent = 'Edit project';
  document.getElementById('saveProjectButton').textContent = 'Stage changes';
  document.getElementById('cancelEditButton').hidden = false;

  const stagedImage = stagedImages.get(project.id);
  const currentImage = stagedImage ? stagedImage.previewUrl : project.image;
  showImagePreview(currentImage, stagedImage ? 'New image staged' : 'Current gallery image');
  showMessage(projectMessage, '');
  projectForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetProjectForm() {
  projectForm.reset();
  editingId = null;
  imageInput.required = true;
  clearImagePreview();
  document.getElementById('formHeading').textContent = 'Add a project';
  document.getElementById('saveProjectButton').textContent = 'Add project';
  document.getElementById('cancelEditButton').hidden = true;
}

function deleteProject(project) {
  const stagedImage = stagedImages.get(project.id);
  if (stagedImage) {
    URL.revokeObjectURL(stagedImage.previewUrl);
    stagedImages.delete(project.id);
  }
  projects = projects.filter((item) => item.id !== project.id);
  hasGalleryChanges = true;
  renderProjects();
  showMessage(projectMessage, 'Project removed. Download the updated gallery file to publish this change.');
}

projectForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(projectForm);
  const title = String(formData.get('title') || '').trim();
  const category = String(formData.get('category') || '');
  const description = String(formData.get('description') || '').trim();
  const file = imageInput.files[0];

  try {
    const stagedImage = file ? prepareImage(file, title) : null;
    const id = editingId || `project-${crypto.randomUUID()}`;
    const existing = projects.find((project) => project.id === id);
    const nextProject = {
      ...(existing || {}),
      id,
      title,
      category,
      description,
      alt: title,
      placeholder: false,
      changed: true
    };

    if (stagedImage) {
      const previousImage = stagedImages.get(id);
      if (previousImage) URL.revokeObjectURL(previousImage.previewUrl);
      stagedImages.set(id, stagedImage);
      nextProject.image = stagedImage.path;
    } else if (!existing) {
      throw new Error('Choose a project photo before adding the project.');
    }

    if (existing) {
      projects = projects.map((project) => project.id === id ? nextProject : project);
    } else {
      projects = [nextProject, ...projects];
    }

    hasGalleryChanges = true;
    renderProjects();
    resetProjectForm();
    showMessage(projectMessage, 'Project staged. Download its image and the updated gallery file to publish it.');
    showMessage(publishMessage, '');
  } catch (error) {
    showMessage(projectMessage, error.message, true);
  }
});

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) {
    if (editingId) {
      const project = projects.find((item) => item.id === editingId);
      const stagedImage = stagedImages.get(editingId);
      if (stagedImage) showImagePreview(stagedImage.previewUrl, 'New image staged');
      else if (project) showImagePreview(project.image, 'Current gallery image');
    } else {
      clearImagePreview();
    }
    return;
  }

  try {
    const extension = allowedTypes.get(file.type);
    if (!extension) throw new Error('Use a JPEG, PNG, WebP, or GIF image.');
    if (!file.size || file.size > 10 * 1024 * 1024) {
      throw new Error('Choose an image between 1 byte and 10 MB.');
    }
    const temporaryUrl = URL.createObjectURL(file);
    showImagePreview(temporaryUrl, `Preview: ${file.name}`, true);
    showMessage(projectMessage, '');
  } catch (error) {
    imageInput.value = '';
    clearImagePreview();
    showMessage(projectMessage, error.message, true);
  }
});

document.getElementById('cancelEditButton').addEventListener('click', resetProjectForm);

document.getElementById('downloadGalleryButton').addEventListener('click', () => {
  const json = `${JSON.stringify(projects, null, 2)}\n`;
  downloadFile('projects.json', json, 'application/json');
  showMessage(
    publishMessage,
    'Downloaded projects.json. Add it to data/ in your repository along with each downloaded image.'
  );
});

loadProjects().catch((error) => {
  showMessage(projectMessage, error.message, true);
  projectForm.hidden = true;
  projectList.replaceChildren();
});
