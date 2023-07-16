import PixabayApiService from './js/api';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import Notiflix from 'notiflix';
import { refs } from './js/refs';
import { murkupGallery } from './js/murkup';
import { showLoader, hideLoader } from './js/loader';
import { scrollShowBtnToTop, scrollToTop } from './js/scroll-to-top';

let options = {
  root: null,
  rootMargin: '400px',
  threshold: 1.0,
};

let observer = new IntersectionObserver(heandleLoadMore, options);

const pixabayApiService = new PixabayApiService();
scrollShowBtnToTop();

refs.searchFormEl.addEventListener('submit', heandleBtnSearchSubmit);
refs.scrollToTopBtnEl.addEventListener('click', scrollToTop);

async function heandleBtnSearchSubmit(e) {
  e.preventDefault();
  scrollToTop();
  pixabayApiService.query = e.target.elements.searchQuery.value.trim();

  if (pixabayApiService.query === '') {
    return Notiflix.Notify.failure(
      'You cannot send an empty request, please write something'
    );
  }

  pixabayApiService.resetPage();

  try {
    showLoader(refs);
    const { hits, total } = await pixabayApiService.fetchArticles();

    if (total === 0 || !hits) {
      throw new Error();
    }

    Notiflix.Notify.success(`Found ${total} cards matching your request`);
    refs.murkupGalleryContainer.innerHTML = murkupGallery(hits);
    observer.observe(refs.target);

    const gallery = new SimpleLightbox('.gallery a', {
      captionDelay: 250,
      captionsData: 'alt',
      captionPosition: 'bottom',
    });

    if (
      refs.murkupGalleryContainer.getElementsByTagName('li').length === total
    ) {
      Notiflix.Notify.info(
        "We're sorry, but you've reached the end of search results."
      );
    }

    pixabayApiService.incrementPage();
  } catch {
    refs.murkupGalleryContainer.innerHTML = '';
    refs.loadMoreBtnEl.classList.add('is-hidden');
    Notiflix.Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
  } finally {
    hideLoader(refs);
  }
}

async function heandleLoadMore(entries, observer) {
  entries.forEach(async entry => {
    if (entry.isIntersecting) {
      try {
        showLoader(refs);

        const { hits, total } = await pixabayApiService.fetchArticles();
        if (
          refs.murkupGalleryContainer.getElementsByTagName('li').length ===
          total
        ) {
          observer.unobserve(refs.target);
          hideLoader(refs);
          Notiflix.Notify.info(
            "We're sorry, but you've reached the end of search results."
          );
        }
        refs.murkupGalleryContainer.insertAdjacentHTML(
          'beforeend',
          murkupGallery(hits)
        );
       
        pixabayApiService.incrementPage();
      } catch(err) {
        Notiflix.Notify.failure(`Oops, ${err}. Please try again.`);
      } finally{
        hideLoader(refs);
      }
    }
  });
}
