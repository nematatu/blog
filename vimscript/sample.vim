" コメントアウト

echo 'single\tquort'
echo "double\tquort"

let name = "nematatu"

echo name

let animal = {'name': 'cat', 'age': 3}
echo get(animal, 'age')

let animal.color = 'white'
echo animal

call remove(animal, 'color')
echo animal

let list = ['badminton', 77, {'racket': 'Astrox'}]
echo get(list, 1)

echo join(list, 'hello')
echo join(list)

let name = 'nema'

if name ==# 'gorilla'
    echo 'yes, you are gorilla'
elseif name ==# 'nema'
    echo 'yes, you are nema'
else
    echo 'no, you are not gorilla'
endif

echo win_getid()

function! Hello(msg) abort
    echo a:msg
endfunction

call Hello('hello')

function! IsExistsFunc(funcName) abort
if exists('*' . a:funcName)
    echo a:funcName . ' is exists'
    return
endif
echo a:funcName . ' is not exists'
endfunction

let a = 'readdir3'

call IsExistsFunc(a)

execute 'echo' '"nema"'

echo system('echo hello')

let F = {a, b -> a-b}
echo sort([2, 4, 5, 1, 5, 3, 4], F)

augroup MyAutoCmd
    autocmd!
    "autocmd BufWritePre * %s/\s\+$//e
     "autocmd VimEnter * echo 'hello'
     autocmd BufEnter * echo 'hello'
augroup END

