scriptencoding utf-8

if exists('g:loaded_joshuto_vim') | finish | endif

let s:save_cpo = &cpoptions
set cpoptions&vim

""""""""""""""""""""""""""""""""""""""""""""""""""""""

if !exists('g:joshuto_floating_window_winblend')
    let g:joshuto_floating_window_winblend = 0
endif

if !exists('g:joshuto_floating_window_scaling_factor')
  let g:joshuto_floating_window_scaling_factor = 0.9
endif

if !exists('g:joshuto_use_neovim_remote')
  let g:joshuto_use_neovim_remote = executable('nvr') ? 1 : 0
endif

if exists('g:joshuto_floating_window_corner_chars')
  echohl WarningMsg
  echomsg "`g:joshuto_floating_window_corner_chars` is deprecated. Please use `g:joshuto_floating_window_border_chars` instead."
  echohl None
  if !exists('g:joshuto_floating_window_border_chars')
    let g:joshuto_floating_window_border_chars = g:joshuto_floating_window_corner_chars
  endif
endif

if !exists('g:joshuto_floating_window_border_chars')
  let g:joshuto_floating_window_border_chars = ['╭','─', '╮', '│', '╯','─', '╰', '│']
endif

command! Joshuto lua require'joshuto'.joshuto()

""""""""""""""""""""""""""""""""""""""""""""""""""""""

let &cpoptions = s:save_cpo
unlet s:save_cpo

let g:loaded_joshuto_vim = 1
