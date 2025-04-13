// تهيئة مشغل Plyr مع دعم تغيير سرعة التشغيل والتحكم في الجودة
const player = new Plyr('#player', {
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay'],
    settings: ['speed', 'quality'],
    speed: { selected: 1, options: [0.5, 1, 1.5, 2] }
  });
  
  const pages = {
    home: document.getElementById('homePage'),
    classes: document.getElementById('classesPage'),
    video: document.getElementById('videoPage')
  };
  
  const teachersGrid = document.getElementById('teachersGrid');
  const teacherImage = document.getElementById('teacherImage');
  const teacherName = document.getElementById('teacherName');
  const videoTitle = document.getElementById('videoTitle');
  const videoDescription = document.getElementById('videoDescription');
  const classesList = document.getElementById('classesList');
  
  let teachers = [];
  let currentTeacherId = null,
      currentClassIndex = null,
      currentLectureIndex = null;
  let currentTeacher = null;
  
  // تحميل بيانات المدرسين
  async function loadData() {
    try {
      const response = await fetch('js.json');
      const data = await response.json();
      teachers = data.teachers;
      renderTeachers();
    } catch (error) {
      console.error('حدث خطأ:', error);
      teachersGrid.innerHTML = '<p class="error">حدث خطأ في تحميل البيانات</p>';
    }
  }
  
  // عرض المدرسين
  function renderTeachers(filteredTeachers = teachers) {
    if(filteredTeachers.length === 0){
      teachersGrid.innerHTML = '<p>لا يوجد نتائج مطابقة</p>';
      return;
    }
    teachersGrid.innerHTML = filteredTeachers.map(teacher => `
      <div class="teacher-card" onclick="showTeacher('${teacher.id}')">
        <img src="${teacher.image}" alt="${teacher.name}" class="teacher-img">
        <h3 class="teacher-name">${teacher.name}</h3>
      </div>
    `).join('');
  }
  
  function showTeacher(teacherId) {
    const teacher = teachers.find(t => t.id == teacherId);
    if (!teacher) return;
    currentTeacher = teacher;
    currentTeacherId = teacher.id;
    teacherImage.src = teacher.image;
    teacherName.textContent = teacher.name;
    renderClasses(teacher.classes);
    navigate('classes');
  }
  
  function renderClasses(classesData) {
    classesList.innerHTML = classesData.map((cls, classIndex) => `
      <div class="class-card">
        <div class="class-header" onclick="toggleLectures(this)">
          <h3>${cls.name}</h3>
          <span>▼</span>
        </div>
        <div class="lectures-list">
          ${cls.lectures.map((lec, lecIndex) => `
            <div class="lecture-item" onclick="playVideo('${currentTeacher.id}', ${classIndex}, ${lecIndex}, '${lec.url}', '${lec.title}', '${lec.description}')">
              ${lecIndex + 1}. ${lec.title}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }
  
  function toggleLectures(element) {
    const lecturesList = element.parentElement.querySelector('.lectures-list');
    const arrow = element.querySelector('span');
    if (lecturesList.style.display === 'none' || lecturesList.style.display === '') {
      lecturesList.style.display = 'grid';
      arrow.textContent = '▲';
    } else {
      lecturesList.style.display = 'none';
      arrow.textContent = '▼';
    }
  }
  
  function playVideo(teacherId, classIndex, lecIndex, url, title, description) {
    currentTeacherId = teacherId;
    currentClassIndex = classIndex;
    currentLectureIndex = lecIndex;
    const fileExtension = url.split('.').pop().toLowerCase();
    let type = fileExtension === 'm3u8' ? 'application/x-mpegURL' : 'video/mp4';
    player.source = {
      type: 'video',
      sources: [
        { src: url, type: type }
      ]
    };
    player.play();
    videoTitle.textContent = title;
    videoDescription.textContent = description;
    navigate('video');
  }
  
  function navigate(page) {
    window.scrollTo(0, 0);
    if (page !== 'video') {
      player.pause();
      player.source = '';
    }
    Object.values(pages).forEach(p => p.classList.remove('active'));
    pages[page].classList.add('active');
  }
  
  player.on('ended', () => {
    const teacher = teachers.find(t => t.id == currentTeacherId);
    if (!teacher) return;
    const classesData = teacher.classes;
    let newClassIndex = currentClassIndex;
    let newLectureIndex = currentLectureIndex;
    if (newLectureIndex < classesData[newClassIndex].lectures.length - 1) {
      newLectureIndex++;
    } else if (newClassIndex < classesData.length - 1) {
      newClassIndex++;
      newLectureIndex = 0;
    } else {
      return;
    }
    const nextLecture = teacher.classes[newClassIndex].lectures[newLectureIndex];
    playVideo(currentTeacherId, newClassIndex, newLectureIndex, nextLecture.url, nextLecture.title, nextLecture.description);
  });
  
  loadData();
  
  // منع النسخ واللصق
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('selectstart', e => e.preventDefault());
  