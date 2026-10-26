(() => {
  const dialog = document.querySelector('.graphic-dialog');
  if (!dialog) return;
  const groups = {
    forest: {
      title: '교육 프로그램 홍보물',
      sections: [
        { title: '모집 포스터', rows: [
          { layout: 'original-pair', images: [['2023_forest', '2023년 모집 포스터'], ['2024_forest', '2024년 모집 포스터']] },
          { layout: 'mockup', images: [['posters', '포스터 목업']] }
        ] },
        { title: '프로그램 배너', rows: [
          { layout: 'banner-pair', images: [['2024_healing', '프로그램 배너 원본'], ['banner', '배너 목업']] }
        ] }
      ]
    },
    promotion: {
      title: 'SSAFY 제휴 · 홍보 디자인',
      sections: [
        { title: '제휴 프로모션', rows: [
          { layout: 'original-pair', images: [['A3', 'A3 포스터'], ['A6', 'A6 안내물']] },
          { layout: 'mockup', images: [['table_tent', '테이블 텐트 목업']] }
        ] },
        { title: '제휴 안내 자료', rows: [
          { layout: 'original', images: [['A5_Flyer', 'A5 안내 전단']] },
          { layout: 'mockup', images: [['posters_ssafy', '안내 전단 목업']] }
        ] },
        { title: '명함 디자인', rows: [
          { layout: 'mockup', images: [['businesscard', '명함 목업']] }
        ] }
      ]
    }
  };
  const stage = dialog.querySelector('.graphic-dialog-stage');
  let previousOverflow = '';
  document.querySelectorAll('[data-graphic-group]').forEach(button => {
    button.addEventListener('click', () => {
      const group = groups[button.dataset.graphicGroup];
      dialog.querySelector('h2').textContent = group.title;
      stage.replaceChildren();
      group.sections.forEach((section, sectionIndex) => {
        const block = document.createElement('section');
        block.className = 'graphic-dialog-section';
        const heading = document.createElement('h3');
        heading.textContent = section.title;
        block.append(heading);
        section.rows.forEach(row => {
          const layout = document.createElement('div');
          layout.className = `graphic-dialog-row graphic-dialog-${row.layout}`;
          row.images.forEach(([file, label]) => {
            const figure = document.createElement('figure');
            const image = document.createElement('img');
            image.src = `assets/images/projects/04_etc/${file}.webp`;
            image.alt = `${group.title} · ${label}`;
            image.loading = sectionIndex === 0 ? 'eager' : 'lazy';
            image.decoding = 'async';
            const caption = document.createElement('figcaption');
            caption.textContent = label;
            figure.append(image, caption);
            layout.append(figure);
          });
          block.append(layout);
        });
        stage.append(block);
      });
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      dialog.scrollTop = 0;
    });
  });
  dialog.querySelector('.graphic-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.body.style.overflow = previousOverflow; });
})();
